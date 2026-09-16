/** REST v1 resources used by this portfolio. IDs are numeric on the wire. */
export interface NamedResource {
  id: number;
  name: string;
  slug: string;
}

export interface PhotographerResource extends Omit<NamedResource, 'slug'> {
  slug: string | null;
  first_name: string;
}

export interface ImageSize {
  url: string;
  avif_url: string | null;
  width: number | null;
  height: number | null;
}

export interface ImageResource {
  id: number;
  // The exported schema misidentifies these fields; the live API returns a
  // string blurhash, numeric dimensions (or null), and a boolean is_main.
  blurhash: string | null;
  width: number | string | null;
  height: number | string | null;
  is_main: boolean;
  photographer: PhotographerResource | null;
  sizes: Record<string, ImageSize>;
}

export interface PostResource {
  id: number;
  slug: string;
  title: string;
  date: string;
  url: string;
  artists?: NamedResource[];
  venue: NamedResource | null;
  event: NamedResource | null;
  photographers?: PhotographerResource[];
  photos_count: number | null;
  thumbnail: ImageResource | null;
  edition: number | null;
}

/** Detail adds photos; this field is absent from list responses. */
export interface PostDetailResource extends PostResource {
  photos: ImageResource[];
}

export interface ResourceResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> extends ResourceResponse<T[]> {
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
}

export interface PostFilters {
  page?: number;
  per_page?: number;
  photographer?: string;
  only_photographer_images?: boolean;
  q?: string;
  artist?: string;
  venue?: string;
  exclude?: string;
  sort?: 'date' | '-date' | 'random';
}
