import { supabase } from './supabase';

export const FAVORITES_CHANGED_EVENT = 'favorites:changed';

export interface FavoritePhotoV1 {
  imageId: string;
  albumSlug: string;
  artistName: string;
  venueName: string;
  date: string;
  thumbUrl: string;
  fullUrl: string;
  blurhash?: string;
  width?: number;
  height?: number;
  addedAt: string;
}

export type FavoritePhotoInput = Omit<FavoritePhotoV1, 'addedAt'>;

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

let cache: FavoritePhotoV1[] = [];
let authenticated = false;

function dispatchChanged(reason: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(FAVORITES_CHANGED_EVENT, {
      detail: { count: cache.length, reason },
    })
  );
}

// ---------------------------------------------------------------------------
// Supabase row ↔ FavoritePhotoV1 mapping
// ---------------------------------------------------------------------------

interface FavoriteRow {
  image_id: string;
  album_slug: string;
  artist_name: string;
  venue_name: string;
  date: string;
  thumb_url: string;
  full_url: string;
  blurhash: string | null;
  width: number | null;
  height: number | null;
  added_at: string;
}

function rowToFavorite(row: FavoriteRow): FavoritePhotoV1 {
  return {
    imageId: row.image_id,
    albumSlug: row.album_slug,
    artistName: row.artist_name,
    venueName: row.venue_name,
    date: row.date,
    thumbUrl: row.thumb_url,
    fullUrl: row.full_url,
    blurhash: row.blurhash ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    addedAt: row.added_at,
  };
}

function favoriteToInsert(
  userId: string,
  fav: FavoritePhotoV1 | FavoritePhotoInput
) {
  return {
    user_id: userId,
    image_id: fav.imageId,
    album_slug: fav.albumSlug,
    artist_name: fav.artistName,
    venue_name: fav.venueName,
    date: fav.date,
    thumb_url: fav.thumbUrl,
    full_url: fav.fullUrl,
    blurhash: fav.blurhash ?? null,
    width: fav.width ?? null,
    height: fav.height ?? null,
  };
}

// ---------------------------------------------------------------------------
// Login modal bridge
// ---------------------------------------------------------------------------

function showLoginModal(pendingPayload?: FavoritePhotoInput) {
  if (typeof window !== 'undefined' && typeof (window as any).__showLoginModal === 'function') {
    (window as any).__showLoginModal(pendingPayload);
  }
}

// ---------------------------------------------------------------------------
// localStorage migration (one-time on first authenticated init)
// ---------------------------------------------------------------------------

const OLD_STORAGE_KEY = 'behangmotief:favorites:v1';
const MIGRATED_FLAG = 'behangmotief:favorites:migrated';

async function migrateLocalStorage(userId: string) {
  if (typeof window === 'undefined') return;

  try {
    if (localStorage.getItem(MIGRATED_FLAG)) return;

    const raw = localStorage.getItem(OLD_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATED_FLAG, '1');
      return;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(MIGRATED_FLAG, '1');
      return;
    }

    const rows = parsed
      .filter(
        (item: any) =>
          item &&
          typeof item === 'object' &&
          item.imageId &&
          item.albumSlug &&
          item.thumbUrl &&
          item.fullUrl
      )
      .map((item: any) => favoriteToInsert(userId, item as FavoritePhotoV1));

    if (rows.length > 0) {
      await supabase
        .from('favorites')
        .upsert(rows, { onConflict: 'user_id,image_id' });
    }

    localStorage.removeItem(OLD_STORAGE_KEY);
    localStorage.setItem(MIGRATED_FLAG, '1');
  } catch {
    // Migration is best-effort
  }
}

// ---------------------------------------------------------------------------
// Pending favorite (saved before OAuth redirect)
// ---------------------------------------------------------------------------

const PENDING_KEY = 'behangmotief:pending-favorite';

async function processPendingFavorite(userId: string) {
  if (typeof window === 'undefined') return;

  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    if (!raw) return;

    const payload: FavoritePhotoInput = JSON.parse(raw);
    if (!payload.imageId) return;

    // Add to cache optimistically
    const already = cache.some((f) => f.imageId === payload.imageId);
    if (!already) {
      const fav: FavoritePhotoV1 = {
        ...payload,
        addedAt: new Date().toISOString(),
      };
      cache = [fav, ...cache];
      dispatchChanged('added');
    }

    // Persist to Supabase
    await supabase
      .from('favorites')
      .upsert(favoriteToInsert(userId, payload), {
        onConflict: 'user_id,image_id',
      });
  } catch {
    // Best-effort
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

let initPromiseResolve: () => void;
export const ready = new Promise<void>((resolve) => {
  initPromiseResolve = resolve;
});

export async function initFavorites() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      authenticated = false;
      cache = [];
      dispatchChanged('init');
      return;
    }

    authenticated = true;

    // Migrate localStorage favorites on first login
    await migrateLocalStorage(user.id);

    // Fetch all favorites from Supabase
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .order('added_at', { ascending: false });

    cache = (data || []).map(rowToFavorite);
    dispatchChanged('init');

    // Process any pending favorite from pre-auth flow
    await processPendingFavorite(user.id);
  } catch {
    authenticated = false;
    cache = [];
    dispatchChanged('init');
  } finally {
    initPromiseResolve();
  }
}

// ---------------------------------------------------------------------------
// Public API — synchronous reads from cache
// ---------------------------------------------------------------------------

export function getFavorites(): FavoritePhotoV1[] {
  return cache;
}

export function isFavorite(imageId: string): boolean {
  if (!imageId) return false;
  return cache.some((f) => f.imageId === imageId);
}

export function getFavoritesCount(): number {
  return cache.length;
}

export function isAuthenticated(): boolean {
  return authenticated;
}

// ---------------------------------------------------------------------------
// Public API — async mutations
// ---------------------------------------------------------------------------

export async function toggleFavorite(
  payload: FavoritePhotoInput
): Promise<void> {
  if (!authenticated) {
    showLoginModal(payload);
    return;
  }

  const existing = cache.find((f) => f.imageId === payload.imageId);

  if (existing) {
    // Optimistic remove
    const prev = cache;
    cache = cache.filter((f) => f.imageId !== payload.imageId);
    dispatchChanged('removed');

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('image_id', payload.imageId);

    if (error) {
      cache = prev;
      dispatchChanged('rollback');
    }
  } else {
    // Optimistic add
    const fav: FavoritePhotoV1 = {
      ...payload,
      addedAt: new Date().toISOString(),
    };
    const prev = cache;
    cache = [fav, ...cache];
    dispatchChanged('added');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      cache = prev;
      dispatchChanged('rollback');
      return;
    }

    const { error } = await supabase
      .from('favorites')
      .upsert(favoriteToInsert(user.id, payload), {
        onConflict: 'user_id,image_id',
      });

    if (error) {
      cache = prev;
      dispatchChanged('rollback');
    }
  }
}

export async function removeFavorite(imageId: string): Promise<void> {
  const prev = cache;
  cache = cache.filter((f) => f.imageId !== imageId);
  dispatchChanged('removed');

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('image_id', imageId);

  if (error) {
    cache = prev;
    dispatchChanged('rollback');
  }
}
