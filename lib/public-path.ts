function normalizeBasePath(value?: string) {
  const normalized = value?.trim().replace(/^\/+|\/+$/g, '') ?? '';
  return normalized ? `/${normalized}` : '';
}

export function getAlphaBasePath() {
  return normalizeBasePath(process.env.NEXT_PUBLIC_ALPHA_BASE_PATH);
}

export function alphaPath(path = '/') {
  const normalizedPath = `/${path}`.replace(/^\/+/,'/').replace(/\/{2,}/g, '/');
  const basePath = getAlphaBasePath();

  if (normalizedPath === '/') {
    return basePath ? `${basePath}/` : '/';
  }

  return `${basePath}${normalizedPath}`;
}
