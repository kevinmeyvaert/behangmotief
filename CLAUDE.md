# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based photography portfolio website (behangmotief.be) with internationalization support (Dutch and English). The site showcases festival and concert photography, with content dynamically fetched from a GraphQL API.

## Commands

```bash
# Development
npm run dev          # Start dev server at localhost:4321

# Build & Deploy
npm run build        # Build production site to ./dist/
npm run preview      # Preview build locally

# Code Generation
npm run codegen      # Generate TypeScript types from GraphQL schema
```

## Architecture

### Technology Stack
- **Framework**: Astro
- **Styling**: Tailwind CSS v4 (configured via Vite plugin)
- **Deployment**: Vercel with ISR (Incremental Static Regeneration)
- **Data Source**: GraphQL API at graphql.wannabes.be
- **Image Processing**: Sharp, Blurhash for progressive loading

### Project Structure
- `/src/pages/[locale]/` - Localized dynamic routes (`index`, `album/[...slug]`)
- `/src/pages/en/archive.astro` and `/src/pages/nl/archief.astro` - Explicit localized archive routes
- `/src/components/` - Astro components
- `/src/i18n/` - Translation utilities and UI strings
- `/src/lib/` - Core utilities including GraphQL client and queries
- `/src/types/` - TypeScript types (auto-generated from GraphQL)

### Key Features
1. **Internationalization**: Full i18n support with URL prefixes (`/nl/`, `/en/`)
2. **Dynamic Content**: Albums and images fetched from Wannabes GraphQL API
3. **Image Optimization**: Multiple image processing strategies including blurhash placeholders
4. **Lightbox Components**: Custom lightbox implementations for grid and album views

### GraphQL Integration
- Schema endpoint: `https://graphql.wannabes.be/graphql`
- Types generated to `src/types/wannabes.types.ts`
- Queries defined in `src/lib/queries.ts`
- Client wrapper in `src/lib/graphql-client.ts`

### Path Aliases
- `@/*` maps to `./src/*`

## Development Notes

- The site uses server-side rendering with selective ISR exclusions for archive pages
- Images are primarily served from images.wannabes.be with on-the-fly transformations
- Vercel Analytics is enabled for production monitoring
