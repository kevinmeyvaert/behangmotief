import { fetcher } from '@/lib/graphql-client';
import { POSTS, ALBUM, RELATED_ALBUMS } from '@/lib/queries';
import type { 
  SearchQuery, 
  AlbumQuery, 
  RelatedPostsQuery 
} from '@/types/wannabes.types';

interface AlbumSearchParams {
  start?: number;
  limit?: number;
  searchTerm?: string;
}

interface RelatedAlbumsParams {
  artistSlug?: string;
  venueSlug?: string;
}

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

    // Filter for Kevin's photos only
    const filteredAlbums = data.posts.data.filter(post => 
      post.thumbnail?.photographer?.firstName === 'Kevin' ||
      post.images?.some(img => img.photographer?.firstName === 'Kevin')
    );

    return {
      albums: filteredAlbums,
      pagination: data.posts.pagination
    };
  }

  async getAlbumBySlug(slug: string) {
    const data = await fetcher<AlbumQuery>(ALBUM, { slug });
    
    if (!data?.post) {
      return null;
    }

    // Filter images to only include Kevin's photos
    const kevinImages = data.post.images?.filter(
      img => img.photographer?.firstName === 'Kevin'
    ) || [];

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

    const filterKevinPhotos = (posts: any[]) => 
      posts?.filter(post => 
        post.thumbnail?.photographer?.firstName === 'Kevin' ||
        post.images?.some((img: any) => img.photographer?.firstName === 'Kevin')
      ) || [];

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