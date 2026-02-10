// Album/Post card data used by grids and related content.
export interface AlbumPost {
  id: string;
  slug: string;
  date: string;
  artist: {
    name: string;
  };
  venue: {
    name: string;
  };
  event: {
    name: string;
  };
  thumbnail: {
    blurhash: string;
    hires: string;
    dimensions: {
      width: number;
      height: number;
    };
    photographer?: {
      firstName: string;
    };
  };
  images: Array<{
    blurhash: string;
    resized: string;
    photographer?: {
      firstName: string;
    };
  }>;
}

export interface GridLayoutProps {
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: string;
  loading?: 'lazy' | 'eager';
}
