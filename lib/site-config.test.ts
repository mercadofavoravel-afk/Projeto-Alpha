import { afterEach, describe, expect, it } from 'vitest';
import { SITE_CONFIG, siteUrl } from './site-config';

const originalBasePath = process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;

afterEach(() => {
  if (originalBasePath === undefined) delete process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;
  else process.env.NEXT_PUBLIC_ALPHA_BASE_PATH = originalBasePath;
});

describe('site config', () => {
  it('mantém os contatos oficiais centralizados', () => {
    expect(SITE_CONFIG.email).toBe('contato@imoveisdealtopadraorio.com.br');
    expect(SITE_CONFIG.whatsappUrl).toBe('https://wa.me/5521964261042');
  });

  it('monta URL pública na raiz por padrão', () => {
    delete process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;
    expect(siteUrl('/empreendimentos/kronos')).toBe(
      'https://www.imoveisdealtopadraorio.com.br/empreendimentos/kronos',
    );
  });

  it('monta URL pública no diretório Alpha configurado', () => {
    process.env.NEXT_PUBLIC_ALPHA_BASE_PATH = '/alpha';
    expect(siteUrl('/empreendimentos/kronos')).toBe(
      'https://www.imoveisdealtopadraorio.com.br/alpha/empreendimentos/kronos',
    );
  });
});
