interface ImageTransformOptions {
  width?: number;
  height?: number;
  format?: 'jpg' | 'webp' | 'png';
  quality?: number;
  crop?: 'SQ' | 'C' | 'PD1';
  pixelDensity?: number;
}

/**
 * REST image sizes use media.wannabes.be. Curated legacy images use
 * images.wannabes.be, which redirects to r.wannabes.be. Single
 * source for astro.config.mjs `image.domains` and the routes that fetch images.
 */
export const WANNABES_IMAGE_HOSTS = ['images.wannabes.be', 'r.wannabes.be', 'media.wannabes.be'] as const;

export interface ParsedImageUrl {
  path: string;
  crop?: ImageTransformOptions['crop'];
}

export class ImageUrlBuilder {
  private static readonly BASE_URL = 'https://images.wannabes.be';
  private static readonly TRANSFORM_SEGMENT = /^[SFQ]=/;

  /**
   * Split a Wannabes URL back into its image path and crop mode, dropping any
   * transform segments. Lets the image service re-derive sizes for `srcset`
   * from URLs that already carry a baked-in width.
   */
  static parse(url: string): ParsedImageUrl | null {
    if (!url.startsWith(`${this.BASE_URL}/`)) {
      return null;
    }

    const segments = url.slice(this.BASE_URL.length + 1).split('/');
    const path = segments.filter((segment) => !this.TRANSFORM_SEGMENT.test(segment)).join('/');
    if (!path) {
      return null;
    }

    const crop = segments
      .find((segment) => segment.startsWith('S='))
      ?.split(',')
      .find((part) => part.startsWith('C='))
      ?.slice(2) as ImageTransformOptions['crop'] | undefined;

    return { path, crop };
  }

  static build(imagePath: string, options: ImageTransformOptions = {}): string {
    const {
      width,
      height,
      format,
      quality,
      crop,
      pixelDensity = 1
    } = options;

    const params: string[] = [];
    
    // Combine size, crop, and pixel density parameters into single S= parameter
    if (width || height || crop) {
      const sizeParams: string[] = [];
      if (width) sizeParams.push(`W${width}`);
      if (height) sizeParams.push(`H${height}`);
      if (crop) sizeParams.push(`C=${crop}`);
      if (pixelDensity !== 1) sizeParams.push(`PD${pixelDensity}`);
      params.push(`S=${sizeParams.join(',')}`);
    }
    
    // Format parameter
    if (format) {
      params.push(`F=${format.toUpperCase()}`);
    }
    
    // Quality parameter
    if (quality) {
      params.push(`Q=${quality}`);
    }
    
    // Build final URL
    if (params.length > 0) {
      return `${this.BASE_URL}/${params.join('/')}/${imagePath}`;
    }
    
    return `${this.BASE_URL}/${imagePath}`;
  }
  
  static thumbnail(imagePath: string, size: number = 500): string {
    return this.build(imagePath, {
      width: size,
      height: size,
      crop: 'SQ',
      pixelDensity: 1
    });
  }
  
  static hero(imagePath: string): string {
    return this.build(imagePath, {
      width: 2500,
      height: 2500,
      pixelDensity: 1
    });
  }
  
  static gallery(imagePath: string): string {
    return this.build(imagePath, {
      width: 1200,
      height: 800,
      pixelDensity: 1
    });
  }
  
  static square(imagePath: string, size: number = 500): string {
    return this.build(imagePath, {
      width: size,
      height: size,
      crop: 'SQ',
      pixelDensity: 1
    });
  }
}