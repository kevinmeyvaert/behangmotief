# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based photography portfolio website (behangmotief.be) with internationalization support (Dutch and English). The site showcases festival and concert photography, with content dynamically fetched from a REST API.

## Commands

```bash
# Development
npm run dev          # Start dev server at localhost:4321

# Build & Deploy
npm run build        # Build production site to ./dist/
npm run preview      # Preview build locally

# Validation
npm test             # REST contract and mapping regression tests
npm run check        # Astro diagnostics
```

## Architecture

### Technology Stack
- **Framework**: Astro
- **Styling**: Tailwind CSS v4 (configured via Vite plugin)
- **Deployment**: Vercel with ISR (Incremental Static Regeneration)
- **Data Source**: REST API configured by WANNABES_API_URL
- **Image Processing**: Sharp, Blurhash for progressive loading

### Project Structure
- `/src/pages/[locale]/` - Localized dynamic routes (`index`, `album/[...slug]`)
- `/src/pages/en/archive.astro` and `/src/pages/nl/archief.astro` - Explicit localized archive routes
- `/src/components/` - Astro components
- `/src/i18n/` - Translation utilities and UI strings
- `/src/lib/` - Core utilities including REST client and mapping
- `/src/types/` - TypeScript types (REST resources and view models)

### Key Features
1. **Internationalization**: Full i18n support with URL prefixes (`/nl/`, `/en/`)
2. **Dynamic Content**: Albums and images fetched from Wannabes REST API
3. **Image Optimization**: Multiple image processing strategies including blurhash placeholders
4. **Lightbox Components**: Custom lightbox implementations for grid and album views

### REST Integration
- Private environment variables: `WANNABES_API_URL` and `WANNABES_API_KEY` (see `.env.example`)
- Local endpoint: `https://wannabes.test/api/v1`; production needs a public URL
- Resource types: `src/types/wannabes.types.ts`
- Client: `src/lib/rest-client.ts`; server configuration: `src/lib/wannabes-api.ts`
- View models: `src/lib/album-mapper.ts`
- Filter every portfolio request by `behangmotief`; image requests also use `only_photographer_images=1`
- Lists contain thumbnails; details add `photos`. Use API image-size URLs directly.

### Path Aliases
- `@/*` maps to `./src/*`

## Development Notes

- The site uses server-side rendering with selective ISR exclusions for archive pages
- REST photos are served from media.wannabes.be; curated homepage photos still use the legacy image CDN
- Vercel Analytics is enabled for production monitoring
