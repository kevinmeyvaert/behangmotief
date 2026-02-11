import type { APIRoute } from 'astro';
import { fetcher } from '@/lib/graphql-client';

const GALLERY_SEARCH_QUERY = `
  query GallerySearch($all: String, $limit: Int, $start: Int, $imageWidth: Int!, $imageHeight: Int!) {
    postSearch(
      photographerSlug: "kevin-meyvaert"
      all: $all
      limit: $limit
      start: $start
    ) {
      data {
        id
        date
        artist {
          name
        }
        venue {
          name
        }
        event {
          name
        }
        images {
          id
          resized(width: $imageWidth, height: $imageHeight)
          photographer {
            firstName
          }
        }
      }
    }
  }
`;

interface GallerySearchResponse {
  postSearch?: {
    data?: Array<{
      id: string;
      date?: string | null;
      artist?: {
        name?: string | null;
      } | null;
      venue?: {
        name?: string | null;
      } | null;
      event?: {
        name?: string | null;
      } | null;
      images?: Array<{
        id: string;
        resized?: string | null;
        photographer?: {
          firstName?: string | null;
        } | null;
      } | null> | null;
    } | null> | null;
  } | null;
}

interface GalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  location: string;
  date: string;
  artistHint: string;
  showKey: string;
}

const KEVIN_NAME = 'Kevin';
const MAX_ARTISTS = 40;
const IMAGES_PER_ARTIST = 10;
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

function normalizeLocation(post: NonNullable<NonNullable<GallerySearchResponse['postSearch']>['data']>[number]) {
  return post?.venue?.name || post?.event?.name || 'Unknown location';
}

function normalizeTitle(post: NonNullable<NonNullable<GallerySearchResponse['postSearch']>['data']>[number]) {
  return post?.artist?.name || 'Untitled';
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
  posts: NonNullable<NonNullable<GallerySearchResponse['postSearch']>['data']>,
  artistHint: string,
  allowedArtistKeys: Set<string>
) {
  const items: GalleryItem[] = [];

  for (const post of posts) {
    if (!post?.images?.length) continue;

    const title = normalizeTitle(post);
    const titleKey = normalizeArtistKey(title);
    if (allowedArtistKeys.size > 0 && !allowedArtistKeys.has(titleKey)) continue;

    const location = normalizeLocation(post);
    const date = normalizeDate(post.date);
    const showKey = `${title}|${location}|${date}`;
    const kevinImages = post.images.filter(
      (
        image
      ): image is {
        id: string;
        resized: string;
        photographer?: {
          firstName?: string | null;
        } | null;
      } => Boolean(image?.resized) && image?.photographer?.firstName === KEVIN_NAME
    );
    const selectedCount = Math.min(MAX_IMAGES_PER_POST, kevinImages.length);
    if (!selectedCount) continue;
    const offset = post.id.length % kevinImages.length;

    for (let i = 0; i < selectedCount; i += 1) {
      const image = kevinImages[(offset + i) % kevinImages.length];

      items.push({
        id: image.id,
        imageUrl: image.resized,
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

async function runSearch(
  all: string | undefined,
  limit: number,
  imageWidth: number,
  imageHeight: number
) {
  const response = await fetcher<GallerySearchResponse>(GALLERY_SEARCH_QUERY, {
    all,
    limit,
    start: 0,
    imageWidth,
    imageHeight,
  });

  return response.postSearch?.data || [];
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const artists = parseArtistInput(body);
    const allowedArtistKeys = new Set(artists.map(normalizeArtistKey));
    const { imageWidth, imageHeight } = parseImageSize(body);
    const artistQueries = artists.length > 0 ? artists : ['recent'];

    const batches = await Promise.all(
      artistQueries.map(async (artist) => {
        const posts = await runSearch(
          artist === 'recent' ? undefined : artist,
          IMAGES_PER_ARTIST,
          imageWidth,
          imageHeight
        );
        return extractGalleryItems(posts, artist, allowedArtistKeys);
      })
    );

    let galleryItems = batches.flat();

    if (galleryItems.length < 12 && artists.length === 0) {
      const fallbackPosts = await runSearch(undefined, FALLBACK_LIMIT, imageWidth, imageHeight);
      galleryItems = galleryItems.concat(
        extractGalleryItems(fallbackPosts, 'recent', allowedArtistKeys)
      );
    }

    const diversified = diversifyByShow(galleryItems);

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
          'cache-control': 'no-store',
        },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

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
