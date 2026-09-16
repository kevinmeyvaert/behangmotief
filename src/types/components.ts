/** View models, deliberately separate from the REST wire format. */
export interface AlbumImage {
  id: string;
  blurhash: string;
  url: string;
  thumbnailUrl: string;
  dimensions: { width: number; height: number };
}

export interface AlbumPost {
  id: string;
  slug: string;
  date: string;
  artist: { name: string; slug?: string };
  venue: { name: string; slug?: string };
  event: { name: string };
  thumbnail: AlbumImage;
}

export interface AlbumDetail extends AlbumPost {
  url: string;
  images: AlbumImage[];
  coverImage?: string;
}

export interface GridLayoutProps {
  columns?: { mobile?: number; tablet?: number; desktop?: number };
  gap?: string;
  loading?: 'lazy' | 'eager';
}
