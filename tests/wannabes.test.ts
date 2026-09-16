import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWannabesClient, UpstreamUnavailableError, WannabesHttpError } from '../src/lib/rest-client';
import { mapImage, mapPost } from '../src/lib/album-mapper';
import { AlbumsService } from '../src/services/albums.service';
import { concurrentMap } from '../src/lib/concurrent-map';
import type { ImageResource, PostDetailResource, PostResource } from '../src/types/wannabes.types';

const photo: ImageResource = {
  id: 42, blurhash: 'LCIyg^01~9j0~9DkF^NaAc9tJ-={', width: '1800', height: '1200', is_main: true,
  photographer: { id: 9, name: 'Kevin Meyvaert', first_name: 'Kevin', slug: 'kevin-meyvaert' },
  sizes: {
    large: { url: 'https://media.wannabes.be/42/large.jpg?v=1', avif_url: null, width: 1600, height: null },
    thumb: { url: 'https://media.wannabes.be/42/thumb.jpg?v=1', avif_url: null, width: 800, height: 800 },
  },
};
const post: PostResource = {
  id: 123, slug: '2026/09/05/artist-festival', title: 'Artist', date: '2026-09-05',
  url: 'https://wannabes.test/posts/2026/09/05/artist-festival',
  artists: [{ id: 1, name: 'Artist', slug: 'artist' }], venue: null,
  event: { id: 2, name: 'Festival', slug: 'festival' },
  photos_count: 1, thumbnail: photo, edition: null,
};
const detail: PostDetailResource = { ...post, photos: [photo] };
const page = (data: PostResource[] = [post]) => ({
  data, meta: { current_page: 2, last_page: 4, per_page: 15, total: 52 },
  links: { first: null, last: null, prev: null, next: null },
});
function mockClient(handler: (url: URL, init?: RequestInit) => Response | Promise<Response>) {
  return createWannabesClient({
    baseUrl: 'https://wannabes.test/api/v1/', apiKey: 'test-secret',
    fetch: ((url: URL | RequestInfo, init?: RequestInit) => handler(new URL(String(url)), init)) as typeof fetch,
  });
}

test('archive translates offsets/search into REST pagination with private bearer auth', async () => {
  const service = new AlbumsService(mockClient((url, init) => {
    assert.equal(url.pathname, '/api/v1/posts');
    assert.equal(url.searchParams.get('page'), '2');
    assert.equal(url.searchParams.get('per_page'), '15');
    assert.equal(url.searchParams.get('q'), 'Artist & Festival');
    assert.equal(url.searchParams.get('photographer'), 'kevin-meyvaert');
    assert.equal(url.searchParams.get('only_photographer_images'), '1');
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer test-secret');
    assert.equal(init?.redirect, 'error');
    assert.ok(!url.toString().includes('test-secret'));
    return Response.json(page());
  }));
  const result = await service.searchAlbums({ start: 15, limit: 15, searchTerm: 'Artist & Festival' });
  assert.deepEqual(result.pagination, { start: 15, limit: 15, total: 52 });
  assert.equal(result.albums[0].venue.name, 'Festival');
  assert.equal(result.albums[0].thumbnail.url, photo.sizes.large.url);
});

test('details retain slash slugs and load photos, not a list gallery', async () => {
  const service = new AlbumsService(mockClient((url) => {
    assert.equal(url.pathname, '/api/v1/posts/2026/09/05/artist-festival');
    assert.equal(url.searchParams.get('only_photographer_images'), '1');
    return Response.json({ data: detail });
  }));
  const result = await service.getAlbumBySlug(post.slug);
  assert.equal(result?.images.length, 1);
  assert.equal(result?.images[0].id, '42');
  assert.equal(result?.coverImage, photo.sizes.large.url);
});

test('only detail 404s become missing albums; auth and service failures stay unavailable', async () => {
  const missing = new AlbumsService(mockClient(() => new Response(null, { status: 404 })));
  assert.equal(await missing.getAlbumBySlug('missing'), null);
  await assert.rejects(missing.searchAlbums(), UpstreamUnavailableError);
  for (const status of [401, 403, 422, 429, 500, 503]) {
    const service = new AlbumsService(mockClient(() => new Response('private upstream error', { status })));
    await assert.rejects(service.getAlbumBySlug('album'), (error: unknown) => {
      assert.ok(error instanceof UpstreamUnavailableError);
      assert.ok(error.cause instanceof WannabesHttpError);
      assert.equal(error.cause.status, status);
      assert.ok(!error.message.includes('private'));
      return true;
    });
  }
});

test('timeouts, malformed JSON and missing configuration report upstream unavailability', async () => {
  const client = createWannabesClient({
    baseUrl: 'https://wannabes.test/api/v1', apiKey: 'secret', timeoutMs: 5,
    fetch: ((_url: unknown, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    })) as typeof fetch,
  });
  await assert.rejects(client.listPosts(), UpstreamUnavailableError);
  await assert.rejects(mockClient(() => new Response('<html>')).listPosts(), UpstreamUnavailableError);
  await assert.rejects(createWannabesClient({}).listPosts(), UpstreamUnavailableError);
  await assert.rejects(mockClient(() => Response.json({ data: [] })).listPosts(), UpstreamUnavailableError);
  await assert.rejects(mockClient(() => Response.json({ data: post })).getPost(post.slug), UpstreamUnavailableError);
});

test('mapping handles null fields, multiple artists and rejects another Kevin or unattributed photos', () => {
  const otherKevin = { ...photo, photographer: { ...photo.photographer!, slug: 'kevin-other' } };
  assert.equal(mapImage(otherKevin), null);
  assert.equal(mapImage({ ...photo, photographer: null }), null);
  assert.equal(mapPost({ ...post, thumbnail: null }), null);
  const result = mapPost({ ...post, artists: [...post.artists!, { id: 2, name: 'Guest', slug: 'guest' }],
    thumbnail: { ...photo, width: null, height: null, blurhash: null } });
  assert.equal(result?.artist.name, 'Artist, Guest');
  assert.equal(result?.artist.slug, undefined);
  assert.equal(result?.venue.slug, undefined);
  assert.equal(result?.thumbnail.blurhash, '');
  assert.ok(result!.thumbnail.dimensions.height > 0);
});

test('a set without Kevin photos is not exposed as a portfolio album', async () => {
  const service = new AlbumsService(mockClient(() => Response.json({ data: { ...detail, photos: [] } })));
  assert.equal(await service.getAlbumBySlug(post.slug), null);
});

test('related filters are skipped when absent and exclude the current slug', async () => {
  let requests = 0;
  const service = new AlbumsService(mockClient((url) => {
    requests++;
    assert.equal(url.searchParams.get('artist'), 'artist');
    assert.equal(url.searchParams.get('venue'), null);
    assert.equal(url.searchParams.get('exclude'), post.slug);
    assert.equal(url.searchParams.get('sort'), 'random');
    assert.equal(url.searchParams.get('photographer'), 'kevin-meyvaert');
    return Response.json(page());
  }));
  assert.deepEqual(await service.getRelatedAlbums({}), { sameArtist: [], sameVenue: [] });
  const result = await service.getRelatedAlbums({ artistSlug: 'artist', exclude: post.slug });
  assert.equal(result.sameArtist.length, 1);
  assert.deepEqual(result.sameVenue, []);
  assert.equal(requests, 1);
});

test('gallery detail fan-out preserves order and limits concurrent requests', async () => {
  let active = 0;
  let peak = 0;
  const result = await concurrentMap([1, 2, 3, 4, 5, 6], 2, async (value) => {
    peak = Math.max(peak, ++active);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active--;
    return value * 2;
  });
  assert.deepEqual(result, [2, 4, 6, 8, 10, 12]);
  assert.equal(peak, 2);
});
