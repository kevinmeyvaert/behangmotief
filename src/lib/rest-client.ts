import type { PaginatedResponse, PostDetailResource, PostFilters, PostResource, ResourceResponse } from '../types/wannabes.types';

export const PHOTOGRAPHER_SLUG = 'kevin-meyvaert';
export const PHOTOGRAPHER_FILTER = {
  photographer: PHOTOGRAPHER_SLUG,
  only_photographer_images: true,
} as const;

export class UpstreamUnavailableError extends Error {
  constructor(cause: unknown) {
    super('Wannabes API unavailable', { cause });
    this.name = 'UpstreamUnavailableError';
  }
}

export class WannabesHttpError extends Error {
  constructor(public status: number) {
    super(`Wannabes API returned HTTP ${status}`);
    this.name = 'WannabesHttpError';
  }
}

interface ClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
  /** Reuse successful responses within a warm server instance. */
  cacheTtlMs?: number;
}

const MAX_CACHE_ENTRIES = 500;

/** Server/build only. Never forward upstream bodies or credentials in errors. */
export function createWannabesClient(options: ClientOptions) {
  const cache = new Map<string, { expires: number; value: Promise<unknown> }>();

  function get<T>(path: string, params: PostFilters = {}, allowNotFound = false): Promise<T> {
    if (!options.cacheTtlMs) return request<T>(path, params, allowNotFound);
    const key = `${path}?${JSON.stringify(params)}`;
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;
    cache.delete(key);
    if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
    // Caching the promise lets concurrent renders share one upstream call.
    const value = request<T>(path, params, allowNotFound);
    cache.set(key, { expires: Date.now() + options.cacheTtlMs, value });
    value.catch(() => cache.delete(key));
    return value;
  }

  async function request<T>(path: string, params: PostFilters, allowNotFound: boolean): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 6000);
    try {
      if (!options.baseUrl || !options.apiKey) {
        throw new Error('Configure WANNABES_API_URL and WANNABES_API_KEY');
      }
      const url = new URL(`${options.baseUrl.replace(/\/$/, '')}/${path}`);
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
        }
      }
      const response = await (options.fetch ?? fetch)(url, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${options.apiKey}` },
        signal: controller.signal,
        redirect: 'error',
      });
      if (!response.ok) throw new WannabesHttpError(response.status);
      return await response.json() as T;
    } catch (error) {
      if (error instanceof WannabesHttpError && error.status === 404 && allowNotFound) throw error;
      throw new UpstreamUnavailableError(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async listPosts(params: PostFilters = {}) {
      const result = await get<PaginatedResponse<PostResource>>('posts', params);
      if (!Array.isArray(result?.data) || !Number.isInteger(result.meta?.current_page) ||
        !Number.isInteger(result.meta?.last_page) || !(result.meta?.per_page > 0) ||
        !Number.isInteger(result.meta?.total)) {
        throw new UpstreamUnavailableError(new Error('Invalid REST post pagination'));
      }
      return result;
    },
    async getPost(slug: string, params: PostFilters = {}) {
      const result = await get<ResourceResponse<PostDetailResource>>(
        `posts/${slug.split('/').map(encodeURIComponent).join('/')}`, params, true,
      );
      if (!result?.data || !Array.isArray(result.data.photos)) {
        throw new UpstreamUnavailableError(new Error('Invalid REST post detail'));
      }
      return result;
    },
  };
}

export type WannabesClient = ReturnType<typeof createWannabesClient>;
