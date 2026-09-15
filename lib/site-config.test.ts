import { describe, expect, it } from 'vitest';

import { SITE_CONFIG, siteUrl } from './site-config';

describe('site configuration', () => {
  it('uses the official Imóveis de Alto Padrão Rio contacts', () => {
    expect(SITE_CONFIG.email).toBe('contato@imoveisdealtopadraorio.com.br');
    expect(SITE_CONFIG.whatsapp).toBe('(21) 96426-1042');
    expect(SITE_CONFIG.whatsappUrl).toBe('https://wa.me/5521964261042');
  });

  it('creates only URLs under the public site', () => {
    expect(siteUrl('/empreendimentos/kronos')).toBe(
      'https://www.imoveisdealtopadraorio.com.br/empreendimentos/kronos',
    );
  });
});
