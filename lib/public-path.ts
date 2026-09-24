function normalizeBasePath(value?: string) {
  const normalized = value?.trim().replace(/^\/+|\/+$/g, '') ?? '';
  return normalized ? `/${normalized}` : '';
}

export function getAlphaBasePath() {
  const configured = process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;
  return normalizeBasePath(configured ?? (process.env.NODE_ENV === 'production' ? '/alpha' : ''));
}

export function alphaPath(path = '/') {
  const normalizedPath = `/${path}`.replace(/^\/+/, '/').replace(/\/{2,}/g, '/');
  const basePath = getAlphaBasePath();

  if (normalizedPath === '/') {
    return basePath ? `${basePath}/` : '/';
  }

  return `${basePath}${normalizedPath}`;
}

// Next.js does not prepend basePath to public/ files, even when using next/image.
export function alphaAssetPath(path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) return path;

  const basePath = getAlphaBasePath();
  if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) {
    return path;
  }

  return alphaPath(path);
}
