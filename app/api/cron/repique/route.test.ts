import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ run: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/lead-repique', () => ({ processRepique: mocks.run }));
vi.mock('@/lib/db', () => ({ db: { auditLog: { create: mocks.audit } } }));
import { GET } from './route';
describe('rotina de servidor do repique', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', 'test-only-secret');
    mocks.run.mockResolvedValue({ delivered: 0, skipped: 0, campaigns: 0 });
  });
  it('não permite disparar fila sem autenticação', async () => {
    expect((await GET(new Request('http://localhost/cron'))).status).toBe(401);
    expect(mocks.run).not.toHaveBeenCalled();
  });
  it('registra execução do servidor sem armazenar o segredo', async () => {
    const response = await GET(
      new Request('http://localhost/cron', {
        headers: { authorization: 'Bearer test-only-secret' },
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.audit).toHaveBeenCalledWith({
      data: {
        action: 'lead.repique_server_tick',
        entityType: 'RepiqueScheduler',
        metadata: { delivered: 0, skipped: 0, campaigns: 0 },
      },
    });
  });
});
