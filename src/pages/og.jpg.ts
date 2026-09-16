import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { OG_IMAGE_HEIGHT, OG_IMAGE_TYPE, OG_IMAGE_WIDTH } from '@/lib/og';
import { ImageUrlBuilder, WANNABES_IMAGE_HOSTS } from '@/lib/image-url-builder';

export const prerender = false;

// Only our own CDN may be fetched, so the route can never be used to pull
// arbitrary hosts.
const ALLOWED_HOSTS = new Set<string>(WANNABES_IMAGE_HOSTS);

const LOGO_WIDTH = 300;
const OVERLAY_OPACITY = 0.6;

let logo: Buffer | null | undefined;
let defaultBackground: Buffer | undefined;

const readPublic = (file: string) => readFile(join(process.cwd(), 'public', file));

async function getLogo(): Promise<Buffer | null> {
  if (logo === undefined) {
    try {
      // Rasterised from the SVG so the composite stays a single sharp pipeline.
      logo = await sharp(await readPublic('logo-white.svg'))
        .resize({ width: LOGO_WIDTH })
        .png()
        .toBuffer();
    } catch {
      logo = null;
    }
  }
  return logo;
}

async function getDefaultBackground(): Promise<Buffer> {
  defaultBackground ??= await readPublic('og-default-bg.jpg');
  return defaultBackground;
}

/**
 * Fetch the requested photo, or fall back to the brand default. Never throws, so
 * unfurlers always get a valid card rather than a broken image.
 */
async function resolveBackground(src: string | null): Promise<Buffer> {
  if (!src) {
    return getDefaultBackground();
  }

  try {
    if (!ALLOWED_HOSTS.has(new URL(src).hostname)) {
      return getDefaultBackground();
    }

    // Request a card-sized variant rather than the full-resolution original.
    const parsed = ImageUrlBuilder.parse(src);
    const response = await fetch(
      ImageUrlBuilder.mediaSize(src, 'large') ??
        (parsed ? ImageUrlBuilder.build(parsed.path, { width: OG_IMAGE_WIDTH }) : src)
    );

    // A missing image redirects to an HTML error page, which still reports ok,
    // so check the type rather than trusting the status.
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      return Buffer.from(await response.arrayBuffer());
    }
  } catch {
    // fall through to the brand default
  }

  return getDefaultBackground();
}

async function renderCard(background: Buffer, wordmark: Buffer | null): Promise<Buffer> {
  // The darkening has to be a composited layer, not .linear(): sharp applies
  // operations in a fixed internal order, so a scalar multiply would land after
  // the composite and dim the wordmark along with the photo.
  return sharp(background)
    .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, { fit: 'cover', position: 'centre' })
    .composite([
      {
        input: {
          create: {
            width: OG_IMAGE_WIDTH,
            height: OG_IMAGE_HEIGHT,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: OVERLAY_OPACITY },
          },
        },
      },
      ...(wordmark ? [{ input: wordmark, gravity: 'centre' as const }] : []),
    ])
    // JPEG rather than PNG: the card is photographic, so PNG came out around
    // 1 MB and WhatsApp drops previews well below that.
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

export const GET: APIRoute = async ({ url }) => {
  const [background, wordmark] = await Promise.all([
    resolveBackground(url.searchParams.get('src')),
    getLogo(),
  ]);

  // Undecodable source bytes must not surface as a broken share card, so retry
  // on the brand default before giving up.
  let body: Buffer;
  try {
    body = await renderCard(background, wordmark);
  } catch {
    body = await renderCard(await getDefaultBackground(), wordmark);
  }

  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': OG_IMAGE_TYPE,
      'Content-Length': String(body.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable, no-transform',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
