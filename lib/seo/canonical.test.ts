import { afterEach, describe, expect, it } from 'vitest';
import { buildCanonical, getSiteUrl } from './canonical';

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalBasePath = process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  if (originalBasePath === undefined) delete process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;
  else process.env.NEXT_PUBLIC_ALPHA_BASE_PATH = originalBasePath;
});

describe('canonical urls', () => {
  it('usa o domínio oficial por padrão', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;
    expect(getSiteUrl()).toBe('https://www.imoveisdealtopadraorio.com.br');
  });

  it('remove barras finais do domínio configurado', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.imoveisdealtopadraorio.com.br///';
    delete process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;
    expect(getSiteUrl()).toBe('https://www.imoveisdealtopadraorio.com.br');
  });

  it('normaliza caminhos para URL canônica', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.imoveisdealtopadraorio.com.br';
    delete process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;
    expect(buildCanonical('empreendimentos//kronos/')).toBe('https://www.imoveisdealtopadraorio.com.br/empreendimentos/kronos');
  });

  it('inclui o diretório Alpha nas URLs canônicas', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.imoveisdealtopadraorio.com.br';
    process.env.NEXT_PUBLIC_ALPHA_BASE_PATH = '/alpha/';
    expect(getSiteUrl()).toBe('https://www.imoveisdealtopadraorio.com.br/alpha');
    expect(buildCanonical('/empreendimentos/kronos')).toBe('https://www.imoveisdealtopadraorio.com.br/alpha/empreendimentos/kronos');
  });
});
