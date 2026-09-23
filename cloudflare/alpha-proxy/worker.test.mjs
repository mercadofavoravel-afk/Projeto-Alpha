import assert from 'node:assert/strict';
import { afterEach, test, mock } from 'node:test';
import worker from './worker.js';

afterEach(() => mock.restoreAll());

for (const path of ['/alpha', '/alpha/empreendimentos', '/alpha?utm_source=site']) {
  test(`sends ${path} to the Alpha origin`, async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('alpha'));

    await worker.fetch(new Request(`https://imoveisdealtopadraorio.com.br${path}`), {
      ALPHA_ORIGIN: 'https://alpha.vercel.app',
    });

    assert.equal(fetchMock.mock.callCount(), 1);
    assert.equal(fetchMock.mock.calls[0].arguments[0].url, `https://alpha.vercel.app${path}`);
  });
}

for (const path of ['/alphabet', '/alpha-extra', '/']) {
  test(`leaves ${path} at the site origin`, async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('wordpress'));
    const request = new Request(`https://imoveisdealtopadraorio.com.br${path}`);

    await worker.fetch(request, { ALPHA_ORIGIN: 'https://alpha.vercel.app' });

    assert.equal(fetchMock.mock.callCount(), 1);
    assert.strictEqual(fetchMock.mock.calls[0].arguments[0], request);
  });
}
