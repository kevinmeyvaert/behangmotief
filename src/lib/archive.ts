import { albumsService } from '@/services/albums.service';
import { UpstreamUnavailableError } from '@/lib/rest-client';

export const POSTS_PER_PAGE = 15;

export interface ArchiveData {
  albums: Awaited<ReturnType<typeof albumsService.searchAlbums>>['albums'];
  pagination: Awaited<ReturnType<typeof albumsService.searchAlbums>>['pagination'];
  currentPage: number;
  searchTerm: string;
}

export function readCurrentPage(url: URL, pageParam?: string): number {
  const fromPath = pageParam ? Number.parseInt(pageParam, 10) : Number.NaN;
  const fromQuery = Number.parseInt(url.searchParams.get('page') || '1', 10);
  const raw = Number.isFinite(fromPath) ? fromPath : fromQuery;
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

/**
 * Loaded by the page rather than the ArchivePage component: a component's
 * frontmatter runs after the Response has been created, so a 503 set there is
 * ignored. Returns null when the album API is unreachable.
 */
export async function loadArchive(url: URL, pageParam?: string): Promise<ArchiveData | null> {
  const currentPage = readCurrentPage(url, pageParam);
  const searchTerm = url.searchParams.get('search') || '';

  try {
    const { albums, pagination } = await albumsService.searchAlbums({
      start: (currentPage - 1) * POSTS_PER_PAGE,
      limit: POSTS_PER_PAGE,
      searchTerm: searchTerm || undefined,
    });
    return { albums, pagination, currentPage, searchTerm };
  } catch (error) {
    if (error instanceof UpstreamUnavailableError) return null;
    throw error;
  }
}
