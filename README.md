<div align="center">
  <img src="public/favicon.png" alt="Behangmotief Logo" width="120" height="120">


A modern, multilingual photography portfolio showcasing festival and concert photography across Belgium and Europe

[![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE.svg?style=flat&logo=astro)](https://astro.build)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4.svg?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![GraphQL](https://img.shields.io/badge/GraphQL-E10098.svg?style=flat&logo=graphql&logoColor=white)](https://graphql.org)

🌐 **Live Site**: [behangmotief.be](https://behangmotief.be)

</div>

---

## About

Behangmotief is a professional photography portfolio dedicated to capturing the energy and emotion of live music performances. The site features dynamic galleries from festivals and concerts across Belgium and Europe, with full bilingual support and advanced image optimization techniques.

This project combines modern web technologies with a GraphQL-powered content management system to deliver a fast, accessible, and visually stunning photography showcase.

---

## Features

- **🌍 Full Internationalization**: Seamless bilingual experience (Dutch/English) with URL-based locale routing and translated UI
- **⚡ GraphQL-Powered Content**: Dynamic album and image management through the Wannabes API with real-time synchronization
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
- **[React](https://react.dev)** - Interactive UI components
- **[TypeScript](https://www.typescriptlang.org)** - Type-safe development

### Styling

- **[Tailwind CSS v4](https://tailwindcss.com)** - Utility-first CSS framework via Vite plugin
- **tw-animate-css** - Animation utilities

### Data & API

- **[GraphQL](https://graphql.org)** - Query language for content API
- **graphql-request** - Lightweight GraphQL client
- **GraphQL Code Generator** - Automatic TypeScript type generation from schema

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

3. **Start the development server**

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
| `npm run codegen` | Generate TypeScript types from GraphQL schema |

---

## Project Structure

```
/
├── src/
│   ├── pages/[locale]/            # Internationalized page routes
│   │   ├── index.astro           # Homepage with featured work
│   │   ├── [...archive].astro    # Paginated album archive
│   │   ├── album/[...slug].astro # Individual album pages
│   │   ├── contact.astro         # Contact page
│   │   └── grid.astro            # Full image grid view
│   ├── components/                # Astro & React components
│   │   ├── *Lightbox.astro       # Gallery lightbox viewers
│   │   ├── MasonryGrid.astro     # Responsive image layouts
│   │   ├── BlurHashImage.astro   # Progressive image loading
│   │   ├── HeroCarousel.astro    # Homepage carousel
│   │   └── StructuredData.astro  # SEO metadata
│   ├── i18n/                      # Internationalization
│   │   ├── translations/         # UI string translations (nl/en)
│   │   └── utils.ts              # i18n helper functions
│   ├── lib/                       # Core utilities
│   │   ├── graphql-client.ts     # GraphQL API client wrapper
│   │   ├── queries.ts            # GraphQL query definitions
│   │   └── image-utils.ts        # Image processing helpers
│   ├── types/                     # TypeScript definitions
│   │   └── wannabes.types.ts     # Auto-generated GraphQL types
│   └── layouts/                   # Page layouts
│       └── Layout.astro          # Base layout template
├── public/                        # Static assets
│   ├── fonts/                    # Web fonts
│   └── images/                   # Static images
├── astro.config.mjs              # Astro configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── codegen.yml                   # GraphQL Code Generator config
└── vercel.json                   # Vercel deployment config
```

---

## Architecture

### GraphQL Integration

The site uses the **Wannabes GraphQL API** (`https://graphql.wannabes.be/graphql`) as its content source:

- **Type Safety**: GraphQL Code Generator creates TypeScript types from the schema
- **Efficient Queries**: Optimized queries fetch only necessary data
- **Real-time Sync**: Content updates are reflected through ISR invalidation

Run `npm run codegen` to regenerate types after schema changes.

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
3. **CDN Transformations**: On-the-fly resizing and format conversion via `images.wannabes.be`
4. **Lazy Loading**: Native browser lazy loading for off-screen images
5. **Responsive Images**: Multiple sizes served based on viewport

### Deployment Configuration

Deployed on **Vercel** with:

- **Hybrid Rendering**: SSR with selective ISR for dynamic content
- **ISR Exclusions**: Archive and grid pages use on-demand generation
- **Edge Caching**: Optimized cache headers for static assets
- **Analytics**: Real-time performance and visitor tracking

---

## Development

### Working with Translations

1. Add new UI strings to `src/i18n/translations/[locale].ts`
2. Use the `useTranslations` hook in components
3. Translations are type-checked at build time

### GraphQL Development Workflow

1. Update queries in `src/lib/queries.ts`
2. Run `npm run codegen` to regenerate types
3. Import types from `src/types/wannabes.types.ts`

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
