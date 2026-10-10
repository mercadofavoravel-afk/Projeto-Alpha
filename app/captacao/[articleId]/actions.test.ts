import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: { customerArticle: { findFirst: vi.fn() }, $transaction: vi.fn() },
}));

import { db } from '@/lib/db';
import { submitCustomerArticleLead } from './actions';

const articleId = 'cm12345678901234567890';
function form(extra: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    articleId,
    name: 'Maria Silva',
    phone: '21999999999',
    email: 'maria@example.com',
    objective: 'LIVE',
    typology: 'Studio',
    message: 'Gostaria de plantas.',
    consent: 'true',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    ...extra,
  }))
    data.set(key, value);
  return data;
}

describe('captura comercial isolada', () => {
  beforeEach(() => vi.clearAllMocks());

  it('não registra um contato sem artigo publicado e titular com acesso', async () => {
    vi.mocked(db.customerArticle.findFirst).mockResolvedValue(null);
    await expect(submitCustomerArticleLead(form())).rejects.toThrow('REDIRECT:');
    expect(db.customerArticle.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: articleId,
          status: 'PUBLISHED',
          site: expect.objectContaining({ owner: expect.objectContaining({ isActive: true }) }),
        }),
      }),
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('grava contato e tarefa no site do artigo, sem usar a tabela compartilhada', async () => {
    vi.mocked(db.customerArticle.findFirst).mockResolvedValue({
      id: articleId,
      siteId: 'cm09876543210987654321',
      title: 'Studio para morar',
      slug: 'studio-morar',
    } as never);
    const transaction = {
      customerLead: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue({ id: 'lead-id', createdAt: new Date() }),
      },
      customerLeadActivity: { create: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    vi.mocked(db.$transaction).mockImplementation((async (callback: unknown) =>
      (callback as (tx: unknown) => Promise<unknown>)(transaction)) as typeof db.$transaction);
    await expect(submitCustomerArticleLead(form())).rejects.toThrow('resultado=enviado');
    expect(transaction.customerLead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        siteId: 'cm09876543210987654321',
        articleId,
        phone: '21999999999',
        consent: true,
        source: 'Artigo WordPress: studio-morar',
      }),
    });
    expect(transaction.customerLeadActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ leadId: 'lead-id', type: 'TASK' }),
    });
    expect(transaction).not.toHaveProperty('lead');
  });

  it('descarta o campo antispam sem consultar ou gravar dados', async () => {
    await expect(submitCustomerArticleLead(form({ website: 'spam' }))).rejects.toThrow(
      'resultado=enviado',
    );
    expect(db.customerArticle.findFirst).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
