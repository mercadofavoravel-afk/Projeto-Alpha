import { describe, expect, it, vi } from 'vitest';
import worker, { tick } from './worker';

describe('CRM server scheduler', () => {
  it('calls only fixed CRM endpoints with the secret in the header', async () => {
    const request = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const results = await tick({ CRON_SECRET: 'test-only' }, request);
    expect(results).toHaveLength(2);
    expect(request.mock.calls.map(([url]) => url)).toEqual([
      'https://imoveisdealtopadraorio.com.br/alpha/api/cron/repique',
      'https://imoveisdealtopadraorio.com.br/alpha/api/cron/roleta',
    ]);
    expect(request.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-only' },
        redirect: 'error',
      }),
    );
  });
  it('refuses to send without the secret', async () => {
    const request = vi.fn();
    await expect(tick({}, request)).rejects.toThrow('CRON_SECRET');
    expect(request).not.toHaveBeenCalled();
  });
  it('reports failure while still attempting both endpoints', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    await expect(tick({ CRON_SECRET: 'test-only' }, request)).rejects.toThrow('tick failed');
    expect(request).toHaveBeenCalledTimes(2);
  });
  it('does not expose a public trigger', async () => {
    expect((await worker.fetch()).status).toBe(404);
  });
});
