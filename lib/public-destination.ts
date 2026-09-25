import { SITE_CONFIG, siteUrl } from './site-config';

const PUBLIC_PATHS = ['/empreendimentos/', '/artigos/', '/bairros/'] as const;

export function isPublicSiteUrl(value: string) {
  try {
    const url = new URL(value);
    const site = new URL(SITE_CONFIG.url);
    const officialHosts = [site.hostname, site.hostname.replace(/^www\./, '')];
    return url.protocol === site.protocol && officialHosts.includes(url.hostname);
  } catch {
    return false;
  }
}

export function publicProjectUrl(slug: string) {
  return siteUrl(`/empreendimentos/${encodeURIComponent(slug)}`);
}

export function publicArticleUrl(slug: string) {
  return siteUrl(`/artigos/${encodeURIComponent(slug)}`);
}

export function publicNeighborhoodUrl(slug: string) {
  return siteUrl(`/bairros/${encodeURIComponent(slug)}`);
}

export function isAllowedPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((prefix) => pathname.startsWith(prefix));
}

export function assertPublicDestination(value: string) {
  if (!isPublicSiteUrl(value)) {
    throw new Error('Destino público inválido: use uma URL da Imóveis de Alto Padrão Rio.');
  }
  return value;
}
