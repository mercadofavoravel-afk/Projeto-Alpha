import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({
  catalog: vi.fn(),
  receiptFind: vi.fn(),
  receiptCreate: vi.fn(),
  leadCreate: vi.fn(),
  activity: vi.fn(),
  activities: vi.fn(),
  audit: vi.fn(),
  users: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  db: {
    articleLeadIntegration: { findUnique: calls.catalog },
    externalLeadReceipt: { findUnique: calls.receiptFind },
    $transaction: (callback: (transaction: unknown) => Promise<unknown>) =>
      callback({
        user: { findMany: calls.users, update: calls.updateUser },
        lead: { create: calls.leadCreate },
        externalLeadReceipt: { create: calls.receiptCreate },
        leadActivity: { create: calls.activity, createMany: calls.activities },
        auditLog: { create: calls.audit },
      }),
  },
}));

import { POST } from './route';

const payload = {
  form: { form_id: 'abc123' },
  respondent: {
    respondent_id: 'r-001',
    status: 'completed',
    respondent_utms: { utm_source: 'google' },
    answers: {
      'Nome completo': 'Ana Silva',
      'Telefone / WhatsApp': '21999999999',
      'Autorizo o contato da Imóveis de Alto Padrão Rio': 'Sim',
    },
  },
};
function request(token: string, body: unknown = payload) {
  return new Request(`http://localhost/api/integrations/respondi/leads?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Respondi webhook', () => {
  const previous = process.env.RESPONDI_WEBHOOK_TOKEN;
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESPONDI_WEBHOOK_TOKEN = 'some-long-random-token-at-least-32-characters';
    calls.catalog.mockResolvedValue({
      article: {
        title: 'Plantas no Leblon',
        slug: 'plantas-leblon',
        category: 'Leblon',
        publishStatus: 'PUBLISHED',
      },
    });
    calls.receiptFind.mockResolvedValue(null);
    calls.users.mockResolvedValue([]);
    calls.leadCreate.mockResolvedValue({
      id: 'lead-01',
      name: 'Ana Silva',
      createdAt: new Date(),
      consent: true,
      source: 'Conteúdo | artigo: Plantas no Leblon | região: Leblon',
      neighborhood: 'Leblon',
    });
  });
  afterEach(() => {
    if (previous === undefined) delete process.env.RESPONDI_WEBHOOK_TOKEN;
    else process.env.RESPONDI_WEBHOOK_TOKEN = previous;
  });

  it('rejects unauthenticated and unmapped submissions', async () => {
    expect((await POST(request('wrong'))).status).toBe(401);
    calls.catalog.mockResolvedValueOnce(null);
    expect((await POST(request(process.env.RESPONDI_WEBHOOK_TOKEN!))).status).toBe(422);
    expect(calls.leadCreate).not.toHaveBeenCalled();
  });
  it('links the mapped form to the article and deduplicates retries', async () => {
    const token = process.env.RESPONDI_WEBHOOK_TOKEN!;
    expect((await POST(request(token))).status).toBe(200);
    expect(calls.leadCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        articleSlug: 'plantas-leblon',
        neighborhood: 'Leblon',
        utmSource: 'google',
        consent: true,
      }),
    });
    expect(calls.receiptCreate).toHaveBeenCalledWith({
      data: { provider: 'RESPONDI', externalId: 'abc123:r-001', leadId: 'lead-01' },
    });
    calls.receiptFind.mockResolvedValueOnce({ id: 'receipt-01' });
    expect((await POST(request(token))).status).toBe(200);
    expect(calls.leadCreate).toHaveBeenCalledTimes(1);
  });
});
