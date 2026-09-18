import { getAlphaBasePath } from '../public-path';
import { SITE_CONFIG } from '../site-config';

const DEFAULT_SITE_URL = SITE_CONFIG.url;

export function getSiteUrl() {
  const configuredUrl = (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL
  ).replace(/\/+$/, '');
  const basePath = getAlphaBasePath();

  return basePath && !configuredUrl.endsWith(basePath)
    ? `${configuredUrl}${basePath}`
    : configuredUrl;
}

export function buildCanonical(path = '/') {
  const normalizedPath = `/${path}`
    .replace(/^\/+/, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/\/$/, '');
  return normalizedPath === ''
    ? `${getSiteUrl()}/`
    : `${getSiteUrl()}${normalizedPath}`;
}
