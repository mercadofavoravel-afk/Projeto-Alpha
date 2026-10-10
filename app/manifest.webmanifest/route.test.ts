import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

describe('instalação móvel do Alpha', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('abre o painel dentro do prefixo publicado e usa ícones do mesmo escopo', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALPHA_BASE_PATH', '/alpha');
    const response = GET();
    const manifest = await response.json();
    expect(response.headers.get('content-type')).toContain('application/manifest+json');
    expect(manifest).toMatchObject({
      id: '/alpha/admin',
      start_url: '/alpha/admin',
      scope: '/alpha/',
      display: 'standalone',
    });
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/alpha/icons/alpha-192.png', sizes: '192x192' }),
        expect.objectContaining({ src: '/alpha/icons/alpha-512.png', sizes: '512x512' }),
      ]),
    );
  });
});
