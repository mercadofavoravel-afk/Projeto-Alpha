import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  users: vi.fn(),
  count: vi.fn(),
  transaction: vi.fn(),
  lock: vi.fn(),
  findAudit: vi.fn(),
  createAudit: vi.fn(),
  send: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: { findMany: mocks.users },
    lead: { count: mocks.count },
    $transaction: mocks.transaction,
  },
}));
vi.mock('@/lib/email', () => ({ sendCrmRiskDigestEmail: mocks.send }));

import { GET } from './route';

function request(token = 'correct-secret') {
  return new Request('https://example.com/alpha/api/cron/crm-digest', {
    headers: { authorization: `Bearer ${token}` },
  });
}

describe('resumo diário do CRM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', 'correct-secret');
    vi.stubEnv('RESEND_API_KEY', 'configured');
    vi.stubEnv('EMAIL_FROM', 'Alpha <alertas@example.com>');
    mocks.users.mockResolvedValue([
      { id: 'consultant-1', email: 'team@example.com', role: 'CONSULTANT' },
    ]);
    mocks.count.mockResolvedValue(1);
    mocks.lock.mockResolvedValue([]);
    mocks.findAudit.mockResolvedValue(null);
    mocks.createAudit.mockResolvedValue({ id: 'audit-1' });
    mocks.send.mockResolvedValue(undefined);
    mocks.transaction.mockImplementation((run: (tx: unknown) => Promise<unknown>) =>
      run({
        $queryRaw: mocks.lock,
        auditLog: { findFirst: mocks.findAudit, create: mocks.createAudit },
      }),
    );
  });

  afterEach(() => vi.unstubAllEnvs());

  it('não consulta o CRM sem segredo ou com autorização inválida', async () => {
    expect((await GET(request('wrong'))).status).toBe(401);
    vi.stubEnv('CRON_SECRET', '');
    expect((await GET(request())).status).toBe(503);
    expect(mocks.users).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('envia somente o resumo dos riscos do próprio corretor e registra auditoria', async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sent: 1, skipped: 0, failed: 0 });
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'team@example.com',
        counts: { firstContact: 1, overdueFollowUp: 1, stalled: 1 },
      }),
    );
    for (const call of mocks.count.mock.calls) {
      expect(call[0].where.AND).toContainEqual({ assignedToId: 'consultant-1' });
    }
    expect(mocks.createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'crm.daily_digest.sent', entityId: 'consultant-1' }),
    });
  });

  it('não reenvia quando o resumo do dia já foi registrado', async () => {
    mocks.findAudit.mockResolvedValue({ id: 'existing' });
    expect(await (await GET(request())).json()).toEqual({ sent: 0, skipped: 1, failed: 0 });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('não envia e-mail quando não há risco', async () => {
    mocks.count.mockResolvedValue(0);
    expect(await (await GET(request())).json()).toEqual({ sent: 0, skipped: 1, failed: 0 });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
