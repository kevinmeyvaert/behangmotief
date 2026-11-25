import type { AstroGlobal } from 'astro';
import { albumsService } from '@/services/albums.service';
import { UpstreamUnavailableError } from '@/lib/rest-client';
import { RETRY_AFTER_SECONDS } from '@/lib/http';
import { useTranslatedPath } from '@/i18n/utils';

export const POSTS_PER_PAGE = 15;

export interface ArchiveData {
  albums: Awaited<ReturnType<typeof albumsService.searchAlbums>>['albums'];
  total: number;
  currentPage: number;
  searchTerm: string;
}

/**
 * Loads an archive page from `/archive/` or `/archive/{page}/`. Returns a
 * redirect for page paths that aren't 2 or higher, and null (with a 503 already
 * set) when the album API is unreachable.
 *
 * Called by the page rather than the ArchivePage component: a component's
 * frontmatter runs after the Response has been created, so a 503 set there is
 * ignored.
 */
export async function loadArchive(
  Astro: AstroGlobal,
  locale: 'en' | 'nl'
): Promise<ArchiveData | Response | null> {
  const pageParam = Astro.params.page;
  if (pageParam !== undefined && !/^([2-9]|[1-9]\d+)$/.test(pageParam)) {
    return Astro.redirect(useTranslatedPath(locale)('/archive'));
  }

  // `?page=` is the old pagination format; keep those links working.
  const queryPage = Number.parseInt(Astro.url.searchParams.get('page') || '1', 10);
  const currentPage = Number(pageParam ?? (queryPage > 0 ? queryPage : 1));
  const searchTerm = Astro.url.searchParams.get('search') || '';

  try {
    const { albums, total } = await albumsService.searchAlbums({
      page: currentPage,
      perPage: POSTS_PER_PAGE,
      searchTerm: searchTerm || undefined,
    });
    return { albums, total, currentPage, searchTerm };
  } catch (error) {
    if (!(error instanceof UpstreamUnavailableError)) throw error;
    Astro.response.status = 503;
    Astro.response.headers.set('Retry-After', String(RETRY_AFTER_SECONDS));
    return null;
  }
}
