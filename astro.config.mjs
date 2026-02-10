// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

const SITE_URL = 'https://behangmotief.be';
const WANNABES_API_ENDPOINT = 'https://graphql.wannabes.be/graphql';
const SITEMAP_PAGE_SIZE = 250;
const SITEMAP_FETCH_TIMEOUT_MS = 12000;
const SITEMAP_FETCH_RETRIES = 3;

const SITEMAP_ALBUMS_QUERY = `
  query SitemapAlbums($start: Int!, $limit: Int!) {
    postSearch(
      photographerSlug: "kevin-meyvaert"
      start: $start
      limit: $limit
    ) {
      data {
        slug
      }
      pagination {
        total
        start
        limit
      }
    }
  }
`;

/**
 * @param {string} query
 * @param {Record<string, unknown>} variables
 * @param {number} [attempt]
 * @returns {Promise<any>}
 */
async function fetchGraphQLWithRetry(query, variables, attempt = 1) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SITEMAP_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(WANNABES_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Unexpected status ${response.status}`);
    }

    const payload = await response.json();

    if (payload.errors?.length) {
      throw new Error(payload.errors[0]?.message || 'Unknown GraphQL error');
    }

    return payload.data;
  } catch (error) {
    if (attempt >= SITEMAP_FETCH_RETRIES) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to fetch sitemap album data after ${SITEMAP_FETCH_RETRIES} attempts: ${message}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    return fetchGraphQLWithRetry(query, variables, attempt + 1);
  } finally {
    clearTimeout(timeout);
  }
}

async function getAlbumSitemapPages() {
  /** @type {string[]} */
  const slugs = [];
  let start = 0;
  let total = Number.POSITIVE_INFINITY;

  while (start < total) {
    const data = await fetchGraphQLWithRetry(SITEMAP_ALBUMS_QUERY, {
      start,
      limit: SITEMAP_PAGE_SIZE,
    });

    const postSearch = data?.postSearch;
    /** @type {Array<{ slug?: string | null }>} */
    const pageAlbums = Array.isArray(postSearch?.data) ? postSearch.data : [];
    const pagination = postSearch?.pagination;

    if (!pagination) {
      throw new Error('Sitemap album pagination data is missing from GraphQL response.');
    }

    total = Number(pagination.total || 0);
    for (const post of pageAlbums) {
      const slug = post?.slug;
      if (typeof slug === 'string' && slug.length > 0) {
        slugs.push(slug);
      }
    }

    if (pageAlbums.length === 0) {
      break;
    }

    start += Number(pagination.limit || pageAlbums.length);
  }

  const uniqueSlugs = [...new Set(slugs)];

  return uniqueSlugs.flatMap((slug) => {
    const encodedSlug = encodeURI(slug);
    return [
      `${SITE_URL}/en/album/${encodedSlug}/`,
      `${SITE_URL}/nl/album/${encodedSlug}/`,
    ];
  });
}

const albumSitemapPages = await getAlbumSitemapPages();

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'server',
  trailingSlash: 'always',
  adapter: vercel({
    isr: {
      exclude: ['/nl/archief/', '/en/archive/'],
    },
    webAnalytics: {
      enabled: true,
    },
  }),
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'nl',
        locales: {
          en: 'en-US',
          nl: 'nl-BE',
        },
      },
      customPages: albumSitemapPages,
      filter: (page) => {
        const url = new URL(page, SITE_URL);
        return url.pathname !== '/';
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    locales: ['nl', 'en'],
    defaultLocale: 'nl',
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
