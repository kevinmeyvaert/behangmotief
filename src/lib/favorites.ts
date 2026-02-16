export const FAVORITES_STORAGE_KEY = 'behangmotief:favorites:v1';
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

function getStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function normalizeFavorite(input: unknown): FavoritePhotoV1 | null {
  if (!input || typeof input !== 'object') return null;

  const candidate = input as Partial<FavoritePhotoV1>;
  if (
    !candidate.imageId ||
    !candidate.albumSlug ||
    !candidate.artistName ||
    !candidate.venueName ||
    !candidate.date ||
    !candidate.thumbUrl ||
    !candidate.fullUrl ||
    !candidate.addedAt
  ) {
    return null;
  }

  const normalized: FavoritePhotoV1 = {
    imageId: String(candidate.imageId),
    albumSlug: String(candidate.albumSlug),
    artistName: String(candidate.artistName),
    venueName: String(candidate.venueName),
    date: String(candidate.date),
    thumbUrl: String(candidate.thumbUrl),
    fullUrl: String(candidate.fullUrl),
    addedAt: String(candidate.addedAt),
  };

  if (candidate.blurhash) {
    normalized.blurhash = String(candidate.blurhash);
  }
  if (isPositiveNumber(candidate.width)) {
    normalized.width = candidate.width;
  }
  if (isPositiveNumber(candidate.height)) {
    normalized.height = candidate.height;
  }

  return normalized;
}

function dedupeAndSort(favorites: FavoritePhotoV1[]) {
  const deduped = Array.from(
    new Map(favorites.map((favorite) => [favorite.imageId, favorite])).values()
  );

  return deduped.sort((a, b) => {
    const aTime = Date.parse(a.addedAt);
    const bTime = Date.parse(b.addedAt);
    const aSafe = Number.isNaN(aTime) ? 0 : aTime;
    const bSafe = Number.isNaN(bTime) ? 0 : bTime;
    return bSafe - aSafe;
  });
}

function writeFavorites(nextFavorites: FavoritePhotoV1[], reason: string) {
  const storage = getStorage();
  if (!storage) return nextFavorites;

  const normalized = dedupeAndSort(nextFavorites);
  try {
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    return normalized;
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(FAVORITES_CHANGED_EVENT, {
        detail: {
          count: normalized.length,
          reason,
        },
      })
    );
  }

  return normalized;
}

export function getFavorites() {
  const storage = getStorage();
  if (!storage) return [] as FavoritePhotoV1[];

  let raw: string | null = null;
  try {
    raw = storage.getItem(FAVORITES_STORAGE_KEY);
  } catch {
    return [] as FavoritePhotoV1[];
  }
  if (!raw) return [] as FavoritePhotoV1[];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    try {
      storage.removeItem(FAVORITES_STORAGE_KEY);
    } catch {
      // Ignore.
    }
    return [] as FavoritePhotoV1[];
  }

  if (!Array.isArray(parsed)) {
    try {
      storage.removeItem(FAVORITES_STORAGE_KEY);
    } catch {
      // Ignore.
    }
    return [] as FavoritePhotoV1[];
  }

  const normalized = parsed
    .map((value) => normalizeFavorite(value))
    .filter((value): value is FavoritePhotoV1 => Boolean(value));
  const dedupedAndSorted = dedupeAndSort(normalized);

  // Heal malformed or unsorted data in storage.
  if (dedupedAndSorted.length !== parsed.length) {
    try {
      storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(dedupedAndSorted));
    } catch {
      // Ignore.
    }
  }

  return dedupedAndSorted;
}

export function isFavorite(imageId: string) {
  if (!imageId) return false;
  return getFavorites().some((favorite) => favorite.imageId === imageId);
}

export function toggleFavorite(photoPayload: FavoritePhotoInput) {
  const favorites = getFavorites();
  const index = favorites.findIndex(
    (favorite) => favorite.imageId === photoPayload.imageId
  );

  if (index !== -1) {
    const next = favorites.filter((favorite) => favorite.imageId !== photoPayload.imageId);
    return writeFavorites(next, 'removed');
  }

  const next = [
    {
      ...photoPayload,
      addedAt: new Date().toISOString(),
    },
    ...favorites,
  ];
  return writeFavorites(next, 'added');
}

export function removeFavorite(imageId: string) {
  const next = getFavorites().filter((favorite) => favorite.imageId !== imageId);
  return writeFavorites(next, 'removed');
}

export function clearFavorites() {
  const storage = getStorage();
  if (!storage) return [] as FavoritePhotoV1[];

  try {
    storage.removeItem(FAVORITES_STORAGE_KEY);
  } catch {
    return [] as FavoritePhotoV1[];
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(FAVORITES_CHANGED_EVENT, {
        detail: {
          count: 0,
          reason: 'cleared',
        },
      })
    );
  }

  return [] as FavoritePhotoV1[];
}

export function getFavoritesCount() {
  return getFavorites().length;
}
