import { afterEach, describe, expect, it } from 'vitest';
import { alphaPath, getAlphaBasePath } from './public-path';

const originalBasePath = process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;

afterEach(() => {
  if (originalBasePath === undefined) delete process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;
  else process.env.NEXT_PUBLIC_ALPHA_BASE_PATH = originalBasePath;
});

describe('public path', () => {
  it('mantém os caminhos na raiz quando não há diretório configurado', () => {
    delete process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;
    expect(getAlphaBasePath()).toBe('');
    expect(alphaPath('/api/leads')).toBe('/api/leads');
  });

  it('prefixa e normaliza o diretório público configurado', () => {
    process.env.NEXT_PUBLIC_ALPHA_BASE_PATH = ' /alpha/ ';
    expect(getAlphaBasePath()).toBe('/alpha');
    expect(alphaPath('/')).toBe('/alpha/');
    expect(alphaPath('api/leads')).toBe('/alpha/api/leads');
  });
});
