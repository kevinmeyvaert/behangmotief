import type { APIRoute } from 'astro';
import { wannabesApi } from '@/lib/wannabes-api';
import { PHOTOGRAPHER_FILTER, WannabesHttpError } from '@/lib/rest-client';
import { mapImage } from '@/lib/album-mapper';
import { concurrentMap } from '@/lib/concurrent-map';
import type { PostDetailResource, PostResource } from '@/types/wannabes.types';
import { getPostHogServer } from '@/lib/posthog-server';

interface GalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  location: string;
  date: string;
  artistHint: string;
  showKey: string;
}

const MAX_ARTISTS = 40;
const POSTS_PER_ARTIST = 10;
const FALLBACK_LIMIT = 40;
const MAX_IMAGES = 28;
const MAX_IMAGES_PER_POST = 2;
const DEFAULT_IMAGE_WIDTH = 1400;
const DEFAULT_IMAGE_HEIGHT = 1000;
const MIN_IMAGE_WIDTH = 640;
const MIN_IMAGE_HEIGHT = 480;
const MAX_IMAGE_WIDTH = 1800;
const MAX_IMAGE_HEIGHT = 1400;

function normalizeDate(value?: string | null) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return 'Unknown date';
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeLocation(post: PostResource) {
  return post?.venue?.name || post?.event?.name || 'Unknown location';
}

function normalizeTitle(post: PostResource) {
  return post.artists?.map((artist) => artist.name).join(', ') || post.title || 'Untitled';
}

function normalizeArtistKey(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractGalleryItems(
  posts: PostDetailResource[],
  artistHint: string,
  allowedArtistKeys: Set<string>
) {
  const items: GalleryItem[] = [];

  for (const post of posts) {
    if (!post.photos.length) continue;

    const title = normalizeTitle(post);
    const titleKey = normalizeArtistKey(title);
    if (allowedArtistKeys.size > 0 && !allowedArtistKeys.has(titleKey) &&
      !post.artists?.some((artist) => allowedArtistKeys.has(normalizeArtistKey(artist.name)))) continue;

    const location = normalizeLocation(post);
    const date = normalizeDate(post.date);
    const showKey = `${title}|${location}|${date}`;
    const kevinImages = post.photos.map(mapImage).filter((image) => image !== null);
    const selectedCount = Math.min(MAX_IMAGES_PER_POST, kevinImages.length);
    if (!selectedCount) continue;
    const offset = String(post.id).length % kevinImages.length;

    for (let i = 0; i < selectedCount; i += 1) {
      const image = kevinImages[(offset + i) % kevinImages.length];

      items.push({
        id: image.id,
        imageUrl: image.url,
        title,
        location,
        date,
        artistHint,
        showKey,
      });
    }
  }

  return items;
}

function diversifyByShow(items: GalleryItem[]) {
  const deduped = Array.from(new Map(items.map((item) => [item.id, item])).values());
  const grouped = new Map<string, GalleryItem[]>();

  for (const item of deduped) {
    const bucket = grouped.get(item.showKey);
    if (bucket) {
      bucket.push(item);
      continue;
    }
    grouped.set(item.showKey, [item]);
  }

  const showBuckets = Array.from(grouped.values()).sort((a, b) =>
    a[0].showKey.localeCompare(b[0].showKey)
  );
  const selected: GalleryItem[] = [];

  // Round-robin over shows so one event cannot flood the gallery.
  while (selected.length < MAX_IMAGES) {
    let pushedInRound = 0;

    for (const bucket of showBuckets) {
      const next = bucket.shift();
      if (!next) continue;
      selected.push(next);
      pushedInRound += 1;

      if (selected.length >= MAX_IMAGES) break;
    }

    if (pushedInRound === 0) break;
  }

  return selected;
}

function parseArtistInput(body: unknown): string[] {
  if (!body || typeof body !== 'object') return [];
  const rawArtists = (body as { artists?: unknown }).artists;
  if (!Array.isArray(rawArtists)) return [];

  return rawArtists
    .filter((artist): artist is string => typeof artist === 'string')
    .map((artist) => artist.trim())
    .filter(Boolean)
    .slice(0, MAX_ARTISTS);
}

function parseImageSize(body: unknown) {
  if (!body || typeof body !== 'object') {
    return { imageWidth: DEFAULT_IMAGE_WIDTH, imageHeight: DEFAULT_IMAGE_HEIGHT };
  }

  const rawWidth = Number((body as { imageWidth?: unknown }).imageWidth);
  const rawHeight = Number((body as { imageHeight?: unknown }).imageHeight);
  const hasWidth = Number.isFinite(rawWidth);
  const hasHeight = Number.isFinite(rawHeight);

  const imageWidth = hasWidth
    ? Math.round(Math.min(Math.max(rawWidth, MIN_IMAGE_WIDTH), MAX_IMAGE_WIDTH))
    : DEFAULT_IMAGE_WIDTH;
  const imageHeight = hasHeight
    ? Math.round(Math.min(Math.max(rawHeight, MIN_IMAGE_HEIGHT), MAX_IMAGE_HEIGHT))
    : DEFAULT_IMAGE_HEIGHT;

  return { imageWidth, imageHeight };
}

async function runSearch(all: string | undefined, limit: number) {
  const response = await wannabesApi.listPosts({
    ...PHOTOGRAPHER_FILTER, q: all, per_page: limit, sort: '-date',
  });
  return response.data;
}

// GET so the edge can cache it: the same artists and size give the same gallery.
export const GET: APIRoute = async ({ request, url }) => {
  try {
    const body = {
      artists: url.searchParams.getAll('artist'),
      imageWidth: url.searchParams.get('imageWidth') ?? undefined,
      imageHeight: url.searchParams.get('imageHeight') ?? undefined,
    };
    const artists = parseArtistInput(body);
    const allowedArtistKeys = new Set(artists.map(normalizeArtistKey));
    const { imageWidth, imageHeight } = parseImageSize(body);
    const artistQueries = artists.length > 0 ? artists : ['recent'];

    const batches = await concurrentMap(artistQueries, 4, async (artist) => ({
      artist,
      posts: await runSearch(artists.length === 0 ? undefined : artist,
        artists.length === 0 ? FALLBACK_LIMIT : POSTS_PER_ARTIST),
    }));

    // Lists have only a thumbnail. Pick a bounded, balanced set of albums
    // before loading their galleries, with no more than four requests in flight.
    const candidates = new Map<string, { slug: string; artist: string }>();
    for (let index = 0; index < FALLBACK_LIMIT && candidates.size < MAX_IMAGES; index++) {
      for (const batch of batches) {
        const post = batch.posts[index];
        if (!post || (allowedArtistKeys.size > 0 &&
          !post.artists?.some((artist) => allowedArtistKeys.has(normalizeArtistKey(artist.name))) &&
          !allowedArtistKeys.has(normalizeArtistKey(post.title)))) continue;
        candidates.set(post.slug, { slug: post.slug, artist: batch.artist });
        if (candidates.size === MAX_IMAGES) break;
      }
    }
    const details = await concurrentMap([...candidates.values()], 4, async ({ slug, artist }) => {
      try {
        const { data } = await wannabesApi.getPost(slug, PHOTOGRAPHER_FILTER);
        return extractGalleryItems([data], artist, allowedArtistKeys);
      } catch (error) {
        if (error instanceof WannabesHttpError && error.status === 404) return [];
        throw error;
      }
    });
    const galleryItems = details.flat();

    const diversified = diversifyByShow(galleryItems);

    // Track server-side event for gallery images loaded
    const posthog = getPostHogServer();
    const sessionId = request.headers.get('X-PostHog-Session-Id');
    const distinctId = request.headers.get('X-PostHog-Distinct-Id') || 'anonymous';

    posthog.capture({
      distinctId,
      event: 'gallery_images_loaded',
      properties: {
        $session_id: sessionId || undefined,
        artist_count: artists.length,
        image_count: diversified.length,
        image_width: imageWidth,
        image_height: imageHeight,
        source: 'api',
      },
    });

    return new Response(
      JSON.stringify({
        images: diversified,
        artists,
        imageWidth,
        imageHeight,
      }),
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Track error in PostHog
    try {
      const posthog = getPostHogServer();
      const sessionId = request.headers.get('X-PostHog-Session-Id');
      const distinctId = request.headers.get('X-PostHog-Distinct-Id') || 'anonymous';

      posthog.capture({
        distinctId,
        event: '$exception',
        properties: {
          $session_id: sessionId || undefined,
          $exception_message: message,
          $exception_source: 'gallery-images-api',
        },
      });
    } catch {
      // Silently fail PostHog tracking on error
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to load gallery images',
        details: message,
      }),
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
        status: 500,
      }
    );
  }
};
