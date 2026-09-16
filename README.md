<div align="center">
  <img src="public/favicon.png" alt="Behangmotief Logo" width="120" height="120">


A modern, multilingual photography portfolio showcasing festival and concert photography across Belgium and Europe

[![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE.svg?style=flat&logo=astro)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4.svg?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

🌐 **Live Site**: [behangmotief.be](https://behangmotief.be)

</div>

---

## About

Behangmotief is a professional photography portfolio dedicated to capturing the energy and emotion of live music performances. The site features dynamic galleries from festivals and concerts across Belgium and Europe, with full bilingual support and advanced image optimization techniques.

This project combines modern web technologies with a REST-powered content management system to deliver a fast, accessible, and visually stunning photography showcase.

---

## Features

- **🌍 Full Internationalization**: Seamless bilingual experience (Dutch/English) with URL-based locale routing and translated UI
- **⚡ REST-Powered Content**: Dynamic album and image management through the Wannabes API with real-time synchronization
- **🖼️ Advanced Image Optimization**: Progressive loading with BlurHash placeholders, Sharp processing, and on-the-fly CDN transformations
- **🎨 Immersive Galleries**: Custom lightbox implementations with masonry layouts and smooth transitions
- **🔍 Smart Discovery**: Search functionality, archive pagination, and related content suggestions by artist/venue
- **🚀 Performance Optimized**: Server-side rendering with Incremental Static Regeneration for optimal speed
- **📊 SEO Excellence**: Automated structured data generation, multi-locale sitemaps, and optimized metadata
- **📱 Fully Responsive**: Tailored experiences across desktop, tablet, and mobile devices

---

## Tech Stack

### Framework & Runtime

- **[Astro](https://astro.build)** - Modern web framework with hybrid SSR/SSG rendering
- **[TypeScript](https://www.typescriptlang.org)** - Type-safe development

### Styling

- **[Tailwind CSS v4](https://tailwindcss.com)** - Utility-first CSS framework via Vite plugin
- **tw-animate-css** - Animation utilities

### Data & API

- **Wannabes REST API** - Authenticated photo archive API

### Image Processing

- **[Sharp](https://sharp.pixelplumbing.com)** - High-performance image processing
- **[BlurHash](https://blurha.sh)** - Progressive image placeholders for smooth loading

### Deployment & Analytics

- **[Vercel](https://vercel.com)** - Deployment platform with ISR support
- **Vercel Analytics** - Real-time visitor insights
- **Vercel Speed Insights** - Performance monitoring

### SEO & Optimization

- **@astrojs/sitemap** - Automatic multi-locale sitemap generation
- Structured data/JSON-LD for rich search results

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/kevinmeyvaert/behangmotief-astro.git
   cd behangmotief-astro
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure the API**

   Copy `.env.example` to `.env` and fill in your API key (see below).

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The site will be available at `http://localhost:4321`

### Available Commands

| Command           | Action                                        |
| :---------------- | :-------------------------------------------- |
| `npm run dev`     | Start development server at `localhost:4321`  |
| `npm run build`   | Build production site to `./dist/`            |
| `npm run preview` | Preview production build locally              |
| `npm test`        | Run REST contract regression tests            |
| `npm run check`   | Run Astro type and diagnostics checks          |

---

## Project Structure

```
/
├── src/
│   ├── pages/[locale]/            # Localized dynamic routes
│   │   ├── index.astro           # Homepage (/nl and /en)
│   │   └── album/[...slug].astro # Individual album pages
│   ├── pages/en/archive.astro     # English archive page
│   ├── pages/nl/archief.astro     # Dutch archive page
│   ├── pages/index.astro          # Redirects / -> /nl
│   ├── components/                # Astro components
│   │   ├── *Lightbox.astro       # Gallery lightbox viewers
│   │   ├── MasonryGrid.astro     # Responsive image layouts
│   │   ├── BlurHashImage.astro   # Progressive image loading
│   │   ├── HeroCarousel.astro    # Homepage carousel
│   │   └── StructuredData.astro  # SEO metadata
│   ├── i18n/                      # Internationalization
│   │   ├── translations/         # UI string translations (nl/en)
│   │   └── utils.ts              # i18n helper functions
│   ├── lib/                       # Core utilities
│   │   ├── rest-client.ts        # Authenticated REST client
│   │   └── album-mapper.ts       # REST to view-model mapping
│   ├── types/                     # TypeScript definitions
│   │   └── wannabes.types.ts     # REST resource types
│   └── layouts/                   # Page layouts
│       └── Layout.astro          # Base layout template
├── public/                        # Static assets
│   ├── fonts/                    # Web fonts
│   └── images/                   # Static images
├── astro.config.mjs              # Astro configuration
└── package.json                  # Scripts and dependencies
```

---

## Architecture

### Wannabes REST integration

Copy `.env.example` to `.env` and set `WANNABES_API_KEY` to a Wannabes API token.
`WANNABES_API_URL` is the full API base URL (`https://wannabes.test/api/v1` locally).
These variables are server-only; never prefix the token with `PUBLIC_` or commit it.
Set both variables in Vercel for builds and runtime, using a publicly reachable
API URL in production. The local `.test` hostname cannot be reached by Vercel.

Album lists use `GET /posts` with `photographer=kevin-meyvaert` and
`only_photographer_images=1`. Archive offsets map to REST `page`/`per_page`;
search uses `q`. Album details use `GET /posts/{slug}` and its `photos` array.
Related sets use artist/venue slugs and exclude the current album. The interactive
gallery loads a bounded set of details with at most four requests in flight.
Sitemap generation walks all REST pages (100 sets per request).

Resource types live in `src/types/wannabes.types.ts`; `album-mapper.ts` converts
numeric IDs, nullable venues, multiple artists and image sizes into view models.
The OpenAPI export omits the detail `photos` field and misidentifies some image
field types, so these types also reflect verified live responses.

If Node does not trust your local development certificate, use
`NODE_EXTRA_CA_CERTS=/path/to/your/local-CA.pem` when running the app or build.
Do not disable TLS verification.

### Internationalization

Full i18n support with:

- URL-based locales: `/nl/` (Dutch) and `/en/` (English)
- Translated routes and UI strings in `src/i18n/translations/`
- Locale-specific structured data and metadata
- Automatic language detection and switching

### Image Optimization Strategy

Multi-layered approach for optimal performance:

1. **BlurHash Placeholders**: Instant low-resolution previews while images load
2. **Sharp Processing**: Server-side image optimization during build
3. **REST Image Sizes**: API-provided thumbnail and large images on `media.wannabes.be`; curated homepage images retain the legacy CDN
4. **Lazy Loading**: Native browser lazy loading for off-screen images
5. **Responsive Images**: Multiple sizes served based on viewport

### Deployment Configuration

Deployed on **Vercel** with:

- **Hybrid Rendering**: SSR with selective ISR for dynamic content
- **ISR Exclusions**: Archive pages are excluded from ISR
- **Edge Caching**: Optimized cache headers for static assets
- **Analytics**: Real-time performance and visitor tracking

---

## Development

### Working with Translations

1. Add new UI strings to `src/i18n/translations/[locale].ts`
2. Use the `useTranslations` hook in components
3. Translations are type-checked at build time

### API development workflow

1. Update REST resource types and the mapping in `src/lib/album-mapper.ts`.
2. Run `npm test` for API contract and mapping regression tests.
3. Run `npm run check` and `npm run build` with API configuration available.

### Path Aliases

The project uses `@/*` as an alias for `./src/*`:

```typescript
import { getAlbums } from "@/lib/queries";
import { useTranslations } from "@/i18n/utils";
```

---

## License

**All Rights Reserved** © 2024 Kevin Meyvaert

This is a personal photography portfolio. The code and content are not licensed for use, modification, or distribution without explicit permission.

---

## Author

**Kevin Meyvaert** - Festival & Concert Photographer

- Website: [behangmotief.be](https://behangmotief.be)
- Portfolio powered by the [Wannabes](https://wannabes.be) platform

---

_Built with Astro. Because great photography deserves great technology._
