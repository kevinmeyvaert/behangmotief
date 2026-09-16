import type { AlbumImage, AlbumPost } from '../types/components';
import type { ImageResource, PostResource } from '../types/wannabes.types';
import { PHOTOGRAPHER_SLUG } from './rest-client';

export function mapImage(image: ImageResource | null): AlbumImage | null {
  if (!image || image.photographer?.slug !== PHOTOGRAPHER_SLUG) return null;
  const size = image.sizes.large ?? image.sizes.medium ?? image.sizes.original;
  if (!size?.url) return null;
  const width = Number(image.width) || Number(size.width) || 1200;
  const height = Number(image.height) || Number(size.height) || Math.round(width * 2 / 3);
  return {
    id: String(image.id),
    blurhash: typeof image.blurhash === 'string' ? image.blurhash : '',
    url: size.url,
    thumbnailUrl: image.sizes.thumb?.url || size.url,
    dimensions: { width, height },
  };
}

export function mapPost(post: PostResource): AlbumPost | null {
  const thumbnail = mapImage(post.thumbnail);
  if (!thumbnail) return null;
  const artists = post.artists ?? [];
  return {
    id: String(post.id),
    slug: post.slug,
    date: post.date,
    artist: {
      name: artists.map((artist) => artist.name).join(', ') || post.title,
      slug: artists.length === 1 ? artists[0].slug : undefined,
    },
    venue: { name: post.venue?.name || post.event?.name || '', slug: post.venue?.slug },
    event: { name: post.event?.name || '' },
    thumbnail,
  };
}
