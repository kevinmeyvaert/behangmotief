import { fetcher } from '@/lib/graphql-client';
import { POSTS, ALBUM, RELATED_ALBUMS } from '@/lib/queries';
import type { AlbumPost } from '@/types/components';
import type { AlbumQuery, RelatedPostsQuery, SearchQuery } from '@/types/wannabes.types';

interface AlbumSearchParams {
  start?: number;
  limit?: number;
  searchTerm?: string;
}

interface RelatedAlbumsParams {
  artistSlug?: string;
  venueSlug?: string;
}

type RelatedAlbum = RelatedPostsQuery['sameArtist']['data'][number];
type AlbumDetail = AlbumQuery['post'];

const isKevinPhoto = (photographer?: { firstName: string }) =>
  photographer?.firstName === 'Kevin';

class AlbumsService {
  async searchAlbums({ start = 0, limit = 12, searchTerm }: AlbumSearchParams = {}) {
    const data = await fetcher<SearchQuery>(POSTS, {
      start,
      limit,
      all: searchTerm || undefined,
    });

    if (!data?.posts) {
      return {
        albums: [],
        pagination: { start: 0, limit: 12, total: 0 }
      };
    }

    const filteredAlbums = data.posts.data.filter(
      (post) =>
        isKevinPhoto(post.thumbnail?.photographer) ||
        post.images.some((img) => isKevinPhoto(img.photographer))
    ) as AlbumPost[];

    return {
      albums: filteredAlbums,
      pagination: data.posts.pagination
    };
  }

  async getAlbumBySlug(slug: string): Promise<AlbumDetail | null> {
    const data = await fetcher<AlbumQuery>(ALBUM, { slug });
    
    if (!data?.post) {
      return null;
    }

    const kevinImages = data.post.images.filter((img) =>
      isKevinPhoto(img.photographer)
    );

    return {
      ...data.post,
      images: kevinImages
    };
  }

  async getRelatedAlbums({ artistSlug, venueSlug }: RelatedAlbumsParams) {
    const data = await fetcher<RelatedPostsQuery>(RELATED_ALBUMS, {
      artistSlug,
      venueSlug
    });

    const filterKevinPhotos = (posts: RelatedAlbum[]) =>
      posts.filter(
        (post) =>
          isKevinPhoto(post.thumbnail?.photographer) ||
          post.images.some((img) => isKevinPhoto(img.photographer))
      ) as AlbumPost[];

    return {
      sameArtist: filterKevinPhotos(data?.sameArtist?.data || []),
      sameVenue: filterKevinPhotos(data?.sameVenue?.data || [])
    };
  }

  async getRecentAlbums(limit: number = 6) {
    const { albums } = await this.searchAlbums({ limit, start: 0 });
    return albums;
  }
}

export const albumsService = new AlbumsService();
