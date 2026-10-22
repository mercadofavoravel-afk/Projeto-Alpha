import { afterEach, describe, expect, it, vi } from 'vitest';
const process = vi.hoisted(() => vi.fn());
vi.mock('@/lib/lead-routing', () => ({ processRouletteQueues: process }));
import { GET } from './route';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe('rotina protegida da roleta', () => {
  it('não processa com segredo ausente ou incorreto', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await GET(new Request('https://example.com'))).status).toBe(503);
    vi.stubEnv('CRON_SECRET', 'configured-secret');
    expect(
      (
        await GET(
          new Request('https://example.com', { headers: { authorization: 'Bearer wrong' } }),
        )
      ).status,
    ).toBe(401);
    expect(process).not.toHaveBeenCalled();
  });
  it('processa uma vez com autorização válida', async () => {
    vi.stubEnv('CRON_SECRET', 'configured-secret');
    process.mockResolvedValue({ assigned: 2, scanned: 2 });
    const response = await GET(
      new Request('https://example.com', {
        headers: { authorization: 'Bearer configured-secret' },
      }),
    );
    expect(await response.json()).toEqual({ assigned: 2, scanned: 2 });
    expect(process).toHaveBeenCalledTimes(1);
  });
});
