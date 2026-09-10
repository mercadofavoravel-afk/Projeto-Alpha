export const SITE_CONFIG = {
  name: 'Imóveis de Alto Padrão Rio',
  url: 'https://www.imoveisdealtopadraorio.com.br',
  email: 'contato@imoveisdealtopadraorio.com.br',
  whatsapp: '(21) 96426-1042',
  whatsappUrl: 'https://wa.me/5521964261042',
} as const;

export function siteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.url}${normalizedPath}`;
}
