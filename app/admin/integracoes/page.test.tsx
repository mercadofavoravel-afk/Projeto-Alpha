import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mocks = vi.hoisted(() => ({
  permission: vi.fn(),
  receiptCount: vi.fn(),
  receiptLatest: vi.fn(),
  auditCount: vi.fn(),
  auditLatest: vi.fn(),
  mappedForms: vi.fn(),
  published: vi.fn(),
  health: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({ requirePermission: mocks.permission }));
vi.mock('@/lib/lead-notification', () => ({ leadNotificationHealth: mocks.health }));
vi.mock('@/lib/db', () => ({
  db: {
    externalLeadReceipt: { count: mocks.receiptCount, findFirst: mocks.receiptLatest },
    auditLog: { count: mocks.auditCount, findFirst: mocks.auditLatest },
    articleLeadIntegration: { count: mocks.mappedForms },
    article: { count: mocks.published },
  },
}));

import IntegrationsPage from './page';

describe('diagnóstico do recebimento de leads', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.permission.mockResolvedValue({ role: 'ADMIN' });
    mocks.receiptCount.mockResolvedValue(0);
    mocks.receiptLatest.mockResolvedValue(null);
    mocks.auditCount.mockResolvedValue(0);
    mocks.auditLatest.mockResolvedValue(null);
    mocks.mappedForms.mockResolvedValue(0);
    mocks.published.mockResolvedValue(175);
    mocks.health.mockResolvedValue({
      pending: 0,
      oldestPendingAt: null,
      sent: 3,
      latestSentAt: new Date('2026-10-18T15:00:00Z'),
    });
  });

  it('exige permissão de gestão antes de consultar dados da instalação', async () => {
    mocks.permission.mockRejectedValue(new Error('redirect'));
    await expect(IntegrationsPage()).rejects.toThrow('redirect');
    expect(mocks.permission).toHaveBeenCalledWith('users:manage');
    expect(mocks.receiptCount).not.toHaveBeenCalled();
    expect(mocks.health).not.toHaveBeenCalled();
  });

  it('separa a fila de e-mails do recebimento Respondi e dos artigos publicados', async () => {
    mocks.receiptCount.mockImplementation(({ where }) =>
      Promise.resolve(where.provider === 'RESPONDI' ? 2 : 0),
    );
    mocks.mappedForms.mockResolvedValue(4);
    mocks.health.mockResolvedValue({
      pending: 2,
      oldestPendingAt: new Date('2026-10-22T12:00:00Z'),
      sent: 3,
    });
    const html = renderToStaticMarkup(await IntegrationsPage());
    expect(html).toContain('2 avisos aguardando envio.');
    expect(html).toContain('Pendência mais antiga: 22/10/2026, 09:00.');
    expect(html).toContain('Respondi · artigos');
    expect(html).toContain('4 de 175 artigos publicados');
    expect(html).toContain('O cadastro permanece no CRM se o aviso falhar.');
    expect(mocks.receiptCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ provider: 'RESPONDI' }) }),
    );
  });

  it('não apresenta ausência de pendências como prova de integração externa', async () => {
    const html = renderToStaticMarkup(await IntegrationsPage());
    expect(html).toContain('Não há avisos pendentes na fila registrada.');
    expect(html).toContain('Ausência de avisos pendentes não comprova');
    expect(html).toContain('0 de 175 artigos publicados');
  });
});
