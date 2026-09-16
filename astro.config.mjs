// @ts-check
import { defineConfig } from 'astro/config';
import { WANNABES_IMAGE_HOSTS } from './src/lib/image-url-builder';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';
import { createWannabesClient, PHOTOGRAPHER_SLUG } from './src/lib/rest-client';

const SITE_URL = 'https://www.behangmotief.be';
const SITEMAP_PAGE_SIZE = 100;
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'WANNABES_');
const api = createWannabesClient({
  baseUrl: process.env.WANNABES_API_URL || env.WANNABES_API_URL,
  apiKey: process.env.WANNABES_API_KEY || env.WANNABES_API_KEY,
  timeoutMs: 15000,
});

async function getAlbumSitemapPages() {
  /** @type {string[]} */
  const slugs = [];
  let page = 1;
  let lastPage = 1;

  do {
    const result = await api.listPosts({
      photographer: PHOTOGRAPHER_SLUG,
      page,
      per_page: SITEMAP_PAGE_SIZE,
      sort: '-date',
    });
    if (!Array.isArray(result.data) || !Number.isInteger(result.meta?.last_page)) {
      throw new Error('Invalid REST sitemap pagination');
    }
    lastPage = result.meta.last_page;
    slugs.push(...result.data.map((post) => post.slug));
    page += 1;
  } while (page <= lastPage);

  const uniqueSlugs = [...new Set(slugs)];

  return uniqueSlugs.flatMap((slug) => {
    const encodedSlug = encodeURI(slug);
    return [
      `${SITE_URL}/en/album/${encodedSlug}/`,
      `${SITE_URL}/nl/album/${encodedSlug}/`,
    ];
  });
}

const isLocalDev = process.env.npm_lifecycle_event === 'dev';

// Only the build emits a sitemap, and this fetch walks every album, so skip it
// in dev — otherwise a slow API delays server start by minutes.
// A sitemap missing its album URLs is recoverable on the next deploy; a build
// that cannot start is not. Never let the upstream API block shipping.
/** @type {string[]} */
let albumSitemapPages = [];
if (process.argv.includes('build') || process.env.npm_lifecycle_event === 'build') {
  try {
    albumSitemapPages = await getAlbumSitemapPages();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[sitemap] Album URLs omitted from the sitemap: ${message}`);
  }
}


// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'server',
  trailingSlash: isLocalDev ? 'ignore' : 'always',
  image: {
    // Resolves to Wannabes CDN URLs directly, so images never pass through the
    // server. See src/lib/wannabes-image-service.ts.
    service: {
      entrypoint: './src/lib/wannabes-image-service.ts',
    },
    layout: 'constrained',
    responsiveStyles: true,
    breakpoints: [640, 828, 1080, 1280, 1668, 2048, 2560],
    // Astro validates the final URL after following redirects, so every CDN
    // host has to be listed.
    domains: [...WANNABES_IMAGE_HOSTS],
  },
  adapter: vercel({
    imageService: false,
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
