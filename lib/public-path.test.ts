import { afterEach, describe, expect, it, vi } from 'vitest';
import { alphaPath, getAlphaBasePath } from './public-path';

const originalBasePath = process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;

afterEach(() => {
  if (originalBasePath === undefined) delete process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;
  else process.env.NEXT_PUBLIC_ALPHA_BASE_PATH = originalBasePath;
  vi.unstubAllEnvs();
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

  it('usa /alpha em produção quando a variável não foi configurada', () => {
    delete process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;
    vi.stubEnv('NODE_ENV', 'production');
    expect(getAlphaBasePath()).toBe('/alpha');
    expect(alphaPath('/api/leads')).toBe('/alpha/api/leads');
  });

  it('respeita a configuração explícita de raiz em produção', () => {
    process.env.NEXT_PUBLIC_ALPHA_BASE_PATH = '';
    vi.stubEnv('NODE_ENV', 'production');
    expect(getAlphaBasePath()).toBe('');
  });
});
