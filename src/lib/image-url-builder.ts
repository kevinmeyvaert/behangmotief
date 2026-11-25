/**
 * Every Wannabes image is served from media.wannabes.be. Single source for
 * astro.config.mjs `image.domains` and the routes that fetch images.
 */
export const WANNABES_IMAGE_HOSTS = ['media.wannabes.be'] as const;

/** Widths of the resized copies media.wannabes.be keeps next to each original. */
export const MEDIA_SIZES = { medium: 800, large: 1600 } as const;

const MEDIA_URL =
  /^https:\/\/media\.wannabes\.be\/(\d+)\/(?:conversions\/)?(.+?)(?:-(?:medium|large))?\.(?:jpg|jpeg|png|webp)(\?.*)?$/;

/**
 * Point a media.wannabes.be original, medium or large URL at another stored
 * size. Square thumbs are left alone because they are cropped.
 */
export function mediaSize(url: string, size: keyof typeof MEDIA_SIZES): string | null {
  if (url.includes('-thumb')) {
    return null;
  }

  const match = url.match(MEDIA_URL);
  if (!match) {
    return null;
  }

  const [, id, name, query = ''] = match;
  return `https://media.wannabes.be/${id}/conversions/${name}-${size}.jpg${query}`;
}
