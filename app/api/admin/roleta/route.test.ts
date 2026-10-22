import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  transaction: vi.fn(),
  process: vi.fn(),
  checkin: vi.fn(),
  pulse: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({ requireApiUser: mocks.user }));
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/lead-routing', () => ({
  routingTransaction: mocks.transaction,
  processRouletteQueues: mocks.process,
  checkInRoulette: mocks.checkin,
}));
import { GET, POST } from './route';
const request = (payload: unknown, origin = 'https://example.com') =>
  new Request('https://example.com/api/admin/roleta', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({
    id: 'self',
    role: 'CONSULTANT',
    isActive: true,
    acceptsLeads: true,
  });
  mocks.transaction.mockImplementation(async (callback) =>
    callback({ leadRouletteEntry: { updateMany: mocks.pulse } }),
  );
  mocks.process.mockResolvedValue({ assigned: 0 });
});
describe('segurança da roleta', () => {
  it('exige autenticação antes de ler ou executar ações', async () => {
    mocks.user.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await POST(request({ action: 'pulse' }))).status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('não permite configuração por corretor nem ação de outro site', async () => {
    expect(
      (
        await POST(
          request({
            action: 'save',
            queue: {
              name: 'Geral',
              regions: [],
              enabled: true,
              shifts: [{ name: 'Integral', start: 0, end: 0 }],
            },
          }),
        )
      ).status,
    ).toBe(403);
    expect((await POST(request({ action: 'pulse' }, 'https://attacker.invalid'))).status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('presença renova somente inscrições existentes do próprio usuário', async () => {
    expect((await POST(request({ action: 'pulse', userId: 'other' }))).status).toBe(200);
    expect(mocks.pulse).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'self', checkedOutAt: null }),
      }),
    );
    expect(mocks.checkin).not.toHaveBeenCalled();
  });
  it('não apresenta gravação confirmada como falha se a distribuição precisar esperar', async () => {
    mocks.process.mockRejectedValue(new Error('temporary'));
    const response = await POST(request({ action: 'pulse' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: true, warning: expect.any(String) }),
    );
  });
});
