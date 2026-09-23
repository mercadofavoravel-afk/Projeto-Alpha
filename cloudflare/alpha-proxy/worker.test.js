import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from './worker.js';

afterEach(() => vi.unstubAllGlobals());

describe('Alpha path proxy', () => {
  it.each(['/alpha', '/alpha/empreendimentos', '/alpha?utm_source=site'])(
    'sends %s to the Alpha origin',
    async (path) => {
      const fetchMock = vi.fn().mockResolvedValue(new Response('alpha'));
      vi.stubGlobal('fetch', fetchMock);

      await worker.fetch(new Request(`https://imoveisdealtopadraorio.com.br${path}`), {
        ALPHA_ORIGIN: 'https://alpha.vercel.app',
      });

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0][0].url).toBe(`https://alpha.vercel.app${path}`);
    },
  );

  it.each(['/alphabet', '/alpha-extra', '/'])('leaves %s at the site origin', async (path) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('wordpress'));
    vi.stubGlobal('fetch', fetchMock);
    const request = new Request(`https://imoveisdealtopadraorio.com.br${path}`);

    await worker.fetch(request, { ALPHA_ORIGIN: 'https://alpha.vercel.app' });

    expect(fetchMock).toHaveBeenCalledWith(request);
  });
});
