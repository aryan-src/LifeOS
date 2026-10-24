/**
 * Safely parses and normalizes a site URL or relative path with a guaranteed fallback.
 * Prevents ERR_INVALID_URL (TypeError: Invalid URL) crashes during build-time page data collection.
 */
export const DEFAULT_SITE_URL = 'https://lifeosstudents.vercel.app';

/**
 * Returns a guaranteed valid URL object for the site base.
 * Handles missing protocol, empty strings, and malformed environment variables.
 */
export function getValidSiteUrl(inputUrl?: string | null): URL {
  const raw = (
    inputUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    DEFAULT_SITE_URL
  ).trim();

  const withProtocol =
    raw.startsWith('http://') || raw.startsWith('https://')
      ? raw
      : `https://${raw}`;

  try {
    return new URL(withProtocol);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

/**
 * Safely creates a URL instance with guaranteed fallback base.
 */
export function safeUrl(pathOrUrl?: string | null, base?: string | null): URL {
  const fallbackBase = getValidSiteUrl(base).toString();
  if (!pathOrUrl || typeof pathOrUrl !== 'string') {
    return new URL('/', fallbackBase);
  }
  try {
    return new URL(pathOrUrl, fallbackBase);
  } catch {
    return new URL('/', fallbackBase);
  }
}
