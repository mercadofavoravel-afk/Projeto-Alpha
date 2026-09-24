import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  createLead: vi.fn(),
  createActivities: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiPermission: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: async (
      callback: (transaction: {
        lead: { create: typeof database.createLead };
        leadActivity: { createMany: typeof database.createActivities };
      }) => Promise<unknown>,
    ) =>
      callback({
        lead: {
          create: database.createLead,
        },
        leadActivity: {
          createMany: database.createActivities,
        },
      }),
  },
}));

import { POST } from './route';

describe('POST /api/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    database.createLead.mockResolvedValue({
      id: 'lead_organic_01',
      name: 'Cliente orgânico',
      neighborhood: 'Ipanema',
      source: 'Orgânico | artigo: investir em Ipanema | região: Ipanema',
      consent: true,
      createdAt: new Date('2026-09-17T12:00:00.000Z'),
    });
  });

  it('stores a consented organic lead with normalized UTMs and follow-up activities', async () => {
    const response = await POST(
      new Request('http://localhost/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Cliente orgânico',
          phone: '(21) 96426-1042',
          email: 'cliente@example.com',
          typology: 'Studio',
          objective: 'INVEST',
          neighborhood: 'Ipanema',
          source: 'Orgânico | artigo: investir em Ipanema | região: Ipanema',
          utmSource: ' Google ',
          utmMedium: 'Paid Social',
          utmCampaign: 'Leads Ipanema Setembro',
          consent: true,
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      leadId: 'lead_organic_01',
    });

    expect(database.createLead).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'cliente@example.com',
        message: 'Tipologia desejada: Studio',
        utmSource: 'google',
        utmMedium: 'paid_social',
        utmCampaign: 'leads_ipanema_setembro',
      }),
    });

    expect(database.createActivities).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          leadId: 'lead_organic_01',
          type: 'WHATSAPP',
        }),
      ]),
    });
  });

  it('rejects a lead without consent before writing to the CRM', async () => {
    const response = await POST(
      new Request('http://localhost/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Cliente sem consentimento',
          phone: '(21) 96426-1042',
          email: 'cliente@example.com',
          consent: false,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(database.createLead).not.toHaveBeenCalled();
    expect(database.createActivities).not.toHaveBeenCalled();
  });

  it('rejects a lead without email before writing to the CRM', async () => {
    const response = await POST(
      new Request('http://localhost/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Cliente sem e-mail',
          phone: '(21) 96426-1042',
          consent: true,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(database.createLead).not.toHaveBeenCalled();
  });
});
