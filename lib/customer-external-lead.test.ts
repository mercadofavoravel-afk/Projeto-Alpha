import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({
  site: vi.fn(),
  existing: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    customerSite: { findFirst: calls.site },
    customerLead: { findUnique: calls.existing },
    $transaction: calls.transaction,
  },
}));

import { storeCustomerExternalLead } from './customer-external-lead';

const lead = {
  siteId: 'site-a',
  ownerId: 'owner-a',
  provider: 'GOOGLE_ADS' as const,
  externalId: 'ad-lead-123',
  name: 'Cliente',
  phone: '21999999999',
  email: null,
  source: 'Google Ads',
  utmSource: 'google',
};

describe('roteamento de anúncio para o CRM do cliente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.existing.mockResolvedValue(null);
  });

  it('recusa site que não pertence ao titular ou não tem acesso ativo', async () => {
    calls.site.mockResolvedValue(null);
    expect(await storeCustomerExternalLead(lead)).toBe(false);
    expect(calls.site).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'site-a',
          ownerId: 'owner-a',
          owner: expect.objectContaining({ isActive: true }),
        }),
      }),
    );
    expect(calls.transaction).not.toHaveBeenCalled();
  });

  it('grava uma tarefa e origem no site correto, sem acessar Lead da matriz', async () => {
    calls.site.mockResolvedValue({ id: 'site-a' });
    const tx = {
      customerLead: {
        create: vi.fn().mockResolvedValue({ id: 'new-lead', createdAt: new Date() }),
      },
      customerLeadActivity: { create: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    calls.transaction.mockImplementation(async (callback: (value: unknown) => Promise<unknown>) =>
      callback(tx),
    );
    expect(await storeCustomerExternalLead(lead)).toBe(true);
    expect(tx.customerLead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        siteId: 'site-a',
        externalProvider: 'GOOGLE_ADS',
        externalId: 'ad-lead-123',
        consent: false,
      }),
    });
    expect(tx.customerLeadActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ leadId: 'new-lead', type: 'TASK' }),
    });
    expect(tx).not.toHaveProperty('lead');
  });

  it('aceita reentrega do mesmo identificador sem criar outro contato', async () => {
    calls.site.mockResolvedValue({ id: 'site-a' });
    calls.existing.mockResolvedValue({ id: 'existing' });
    expect(await storeCustomerExternalLead(lead)).toBe(true);
    expect(calls.transaction).not.toHaveBeenCalled();
  });
});
