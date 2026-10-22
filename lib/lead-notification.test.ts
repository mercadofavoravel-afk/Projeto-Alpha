import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  lock: vi.fn(),
  findAudit: vi.fn(),
  findLead: vi.fn(),
  createAudit: vi.fn(),
  send: vi.fn(),
  pendingQuery: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: mocks.transaction,
    $queryRaw: mocks.pendingQuery,
  },
}));
vi.mock('@/lib/email', () => ({ sendNewLeadEmail: mocks.send }));

import { deliverLeadNotification, retryPendingLeadNotifications } from './lead-notification';

describe('notificação de lead da matriz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('RESEND_API_KEY', 'configured');
    vi.stubEnv('EMAIL_FROM', 'Alpha <alertas@example.com>');
    mocks.lock.mockResolvedValue([]);
    mocks.findAudit.mockResolvedValueOnce({ id: 'pending' }).mockResolvedValueOnce(null);
    mocks.findLead.mockResolvedValue({
      id: 'lead-1',
      name: 'Cliente',
      phone: '21999999999',
      email: null,
      neighborhood: 'Leblon',
      articleSlug: 'plantas-leblon',
      source: 'Respondi',
      consent: true,
    });
    mocks.send.mockResolvedValue(undefined);
    mocks.createAudit.mockResolvedValue({ id: 'sent' });
    mocks.transaction.mockImplementation((run: (tx: unknown) => Promise<unknown>) =>
      run({
        $executeRaw: mocks.lock,
        auditLog: { findFirst: mocks.findAudit, create: mocks.createAudit },
        lead: { findUnique: mocks.findLead },
      }),
    );
  });

  it('avisa a caixa da matriz após localizar a pendência e registra a entrega', async () => {
    expect(await deliverLeadNotification('lead-1')).toBe(true);
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'contato@imoveisdealtopadraorio.com.br',
        idempotencyKey: 'alpha-matrix-lead-lead-1',
        lead: expect.objectContaining({ articleSlug: 'plantas-leblon' }),
      }),
    );
    expect(mocks.createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'lead.email_notification.sent', entityId: 'lead-1' }),
    });
  });

  it('preserva a pendência para recuperar quando o provedor de e-mail falha', async () => {
    mocks.send.mockRejectedValue(new Error('indisponível'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await deliverLeadNotification('lead-1')).toBe(false);
    expect(mocks.createAudit).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('não envia se já houver entrega registrada', async () => {
    mocks.findAudit.mockReset();
    mocks.findAudit.mockResolvedValueOnce({ id: 'pending' }).mockResolvedValueOnce({ id: 'sent' });
    expect(await deliverLeadNotification('lead-1')).toBe(true);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('recupera pendências não entregues', async () => {
    mocks.pendingQuery.mockResolvedValue([{ entityId: 'lead-1' }]);
    expect(await retryPendingLeadNotifications()).toEqual({ attempted: 1, failed: 0 });
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
});
