import { wannabesApi } from '../lib/wannabes-api';
import { mapImage, mapPost } from '../lib/album-mapper';
import { PHOTOGRAPHER_FILTER, WannabesHttpError, type WannabesClient } from '../lib/rest-client';
import type { AlbumDetail, AlbumPost } from '../types/components';

interface AlbumSearchParams {
  start?: number;
  limit?: number;
  searchTerm?: string;
}

export class AlbumsService {
  constructor(private api: WannabesClient = wannabesApi) {}

  async searchAlbums({ start = 0, limit = 12, searchTerm }: AlbumSearchParams = {}) {
    const data = await this.api.listPosts({
      ...PHOTOGRAPHER_FILTER,
      page: Math.floor(start / limit) + 1,
      per_page: limit,
      q: searchTerm,
      sort: '-date',
    });
    return {
      albums: data.data.map(mapPost).filter((post): post is AlbumPost => post !== null),
      pagination: {
        start: (data.meta.current_page - 1) * data.meta.per_page,
        limit: data.meta.per_page,
        total: data.meta.total,
      },
    };
  }

  async getAlbumBySlug(slug: string): Promise<AlbumDetail | null> {
    try {
      const { data } = await this.api.getPost(slug, PHOTOGRAPHER_FILTER);
      const images = data.photos.map(mapImage).filter((image) => image !== null);
      const post = mapPost(data);
      if (!post || !images.length) return null;
      return { ...post, url: data.url, images, coverImage: post.thumbnail.url };
    } catch (error) {
      if (error instanceof WannabesHttpError && error.status === 404) return null;
      throw error;
    }
  }

  async getRelatedAlbums({ artistSlug, venueSlug, exclude }: {
    artistSlug?: string; venueSlug?: string; exclude?: string;
  }) {
    const search = async (filter: { artist?: string; venue?: string }) => {
      const data = await this.api.listPosts({ ...PHOTOGRAPHER_FILTER, ...filter, exclude, per_page: 4, sort: 'random' });
      return data.data.map(mapPost).filter((post): post is AlbumPost => post !== null);
    };
    const [sameArtist, sameVenue] = await Promise.all([
      artistSlug ? search({ artist: artistSlug }) : [],
      venueSlug ? search({ venue: venueSlug }) : [],
    ]);
    return { sameArtist, sameVenue };
  }

  async getRecentAlbums(limit = 6) {
    const { albums } = await this.searchAlbums({ limit });
    return albums;
  }
}

export const albumsService = new AlbumsService();
