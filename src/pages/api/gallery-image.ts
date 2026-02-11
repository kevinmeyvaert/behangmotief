import type { APIRoute } from 'astro';

const ALLOWED_IMAGE_HOSTS = new Set(['images.wannabes.be', 'r.wannabes.be']);

function badRequest(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export const GET: APIRoute = async ({ url }) => {
  const source = url.searchParams.get('url');
  if (!source) {
    return badRequest('Missing "url" query parameter.');
  }

  let parsed: URL;
  try {
    parsed = new URL(source);
  } catch {
    return badRequest('Invalid image URL.');
  }

  if (parsed.protocol !== 'https:') {
    return badRequest('Only HTTPS image URLs are allowed.');
  }

  if (!ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) {
    return badRequest('Unsupported image host.');
  }

  let response: Response;
  try {
    response = await fetch(parsed.toString(), {
      redirect: 'follow',
      headers: {
        // Prefer widely supported web image formats.
        accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return badRequest(`Failed to fetch upstream image: ${details}`, 502);
  }

  if (!response.ok) {
    return badRequest(`Upstream image request failed with status ${response.status}.`, 502);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const body = await response.arrayBuffer();

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': contentType,
      'cache-control': 'public, max-age=86400, s-maxage=604800',
    },
  });
};
