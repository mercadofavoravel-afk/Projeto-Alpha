const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  return configuredUrl.replace(/\/+$/, "");
}

export function buildCanonical(path = "/") {
  const normalizedPath = `/${path}`
    .replace(/^\/+/, "/")
    .replace(/\/{2,}/g, "/")
    .replace(/\/$/, "");

  return normalizedPath === ""
    ? `${getSiteUrl()}/`
    : `${getSiteUrl()}${normalizedPath}`;
}
