import type { ExternalImageService, ImageTransform } from 'astro';
import { ImageUrlBuilder, MEDIA_SIZES } from './image-url-builder';

/**
 * Points `<Image />` straight at the Wannabes image CDN.
 *
 * The previous `passthroughImageService()` still routed every image through
 * Astro's `/_image` endpoint, which on Vercel meant a function invocation per
 * image just to proxy the bytes through unchanged. Resolving URLs here keeps the
 * server out of the image path entirely and lets Astro build a real `srcset`.
 */

const SUPPORTED_FORMATS = new Set(['jpg', 'webp', 'png']);

const resolveSrc = (src: ImageTransform['src']) =>
  typeof src === 'string' ? src : src.src;

const buildUrl = (options: ImageTransform) => {
  const src = resolveSrc(options.src);
  const media = ImageUrlBuilder.mediaSize(
    src,
    options.width && options.width <= MEDIA_SIZES.medium ? 'medium' : 'large'
  );
  if (media) {
    return media;
  }

  const parsed = ImageUrlBuilder.parse(src);

  // Local files and anything not served by Wannabes are used as-is.
  if (!parsed) {
    return src;
  }

  return ImageUrlBuilder.build(parsed.path, {
    width: options.width,
    height: options.height,
    crop: parsed.crop,
    format:
      typeof options.format === 'string' && SUPPORTED_FORMATS.has(options.format)
        ? (options.format as 'jpg' | 'webp' | 'png')
        : undefined,
    quality: typeof options.quality === 'number' ? options.quality : undefined,
  });
};

const service: ExternalImageService = {
  getURL(options) {
    return buildUrl(options);
  },

  getSrcSet(options) {
    const { widths, ...transform } = options;
    const src = resolveSrc(options.src);
    const aspectRatio =
      options.width && options.height ? options.width / options.height : undefined;

    // media.wannabes.be only stores fixed sizes, and only Wannabes URLs can be
    // resized, so anything else would emit the same URL under every descriptor.
    const srcsetWidths = ImageUrlBuilder.mediaSize(src, 'large')
      ? Object.values(MEDIA_SIZES)
      : widths?.length && ImageUrlBuilder.parse(src)
        ? widths
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
