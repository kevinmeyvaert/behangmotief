import type { ExternalImageService, ImageTransform } from 'astro';
import { MEDIA_SIZES, mediaSize } from './image-url-builder';

/**
 * Points `<Image />` straight at the Wannabes image CDN.
 *
 * The previous `passthroughImageService()` still routed every image through
 * Astro's `/_image` endpoint, which on Vercel meant a function invocation per
 * image just to proxy the bytes through unchanged. Resolving URLs here keeps the
 * server out of the image path entirely and lets Astro build a real `srcset`.
 */

const resolveSrc = (src: ImageTransform['src']) =>
  typeof src === 'string' ? src : src.src;

// Wannabes photos map to the nearest stored size; local files are used as-is.
const buildUrl = (options: ImageTransform) => {
  const src = resolveSrc(options.src);
  const size = options.width && options.width <= MEDIA_SIZES.medium ? 'medium' : 'large';
  return mediaSize(src, size) ?? src;
};

const service: ExternalImageService = {
  getURL(options) {
    return buildUrl(options);
  },

  getSrcSet(options) {
    const { widths: _widths, ...transform } = options;
    const aspectRatio =
      options.width && options.height ? options.width / options.height : undefined;

    // media.wannabes.be only stores fixed sizes, and nothing else can be
    // resized, so anything else would emit the same URL under every descriptor.
    const srcsetWidths = mediaSize(resolveSrc(options.src), 'large')
      ? Object.values(MEDIA_SIZES)
      : [];

    return srcsetWidths.map((width) => ({
      transform: {
        ...transform,
        width,
        height: aspectRatio ? Math.round(width / aspectRatio) : undefined,
      },
      descriptor: `${width}w`,
    }));
  },

  getHTMLAttributes(options) {
    const {
      src: _src,
      width,
      height,
      format: _format,
      quality: _quality,
      widths: _widths,
      densities: _densities,
      layout: _layout,
      fit: _fit,
      position: _position,
      ...attributes
    } = options;

    return { ...attributes, width, height };
  },
};

export default service;
