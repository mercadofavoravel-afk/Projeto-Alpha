import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  createLead: vi.fn(),
  createActivities: vi.fn(),
  findUsers: vi.fn(),
  updateUser: vi.fn(),
  createAudit: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiPermission: vi.fn(),
}));

const notify = vi.hoisted(() => ({ deliver: vi.fn() }));
vi.mock('@/lib/lead-notification', () => ({
  deliverLeadNotification: notify.deliver,
  leadNotificationPending: (leadId: string) => ({
    action: 'lead.email_notification.pending',
    entityType: 'Lead',
    entityId: leadId,
  }),
}));

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: async (
      callback: (transaction: {
        lead: { create: typeof database.createLead };
        leadActivity: { createMany: typeof database.createActivities };
        user: { findMany: typeof database.findUsers; update: typeof database.updateUser };
        auditLog: { create: typeof database.createAudit };
      }) => Promise<unknown>,
    ) =>
      callback({
        lead: {
          create: database.createLead,
        },
        leadActivity: {
          createMany: database.createActivities,
        },
        user: { findMany: database.findUsers, update: database.updateUser },
        auditLog: { create: database.createAudit },
      }),
  },
}));

import { POST } from './route';

describe('POST /api/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.findUsers.mockResolvedValue([]);
    notify.deliver.mockResolvedValue(true);

    database.createLead.mockResolvedValue({
      id: 'lead_organic_01',
      name: 'Cliente orgânico',
      neighborhood: 'Ipanema',
      articleSlug: 'investir-em-ipanema',
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
          articleSlug: 'investir-em-ipanema',
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
        articleSlug: 'investir-em-ipanema',
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
    expect(database.createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'lead.site_received',
        metadata: expect.objectContaining({
          assignedToId: null,
          articleSlug: 'investir-em-ipanema',
        }),
      }),
    });
    expect(database.createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'lead.email_notification.pending' }),
    });
    expect(notify.deliver).toHaveBeenCalledWith('lead_organic_01');
  });

  it('keeps the CRM lead when the email provider cannot deliver immediately', async () => {
    notify.deliver.mockResolvedValue(false);
    const response = await POST(
      new Request('http://localhost/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Cliente orgânico',
          phone: '(21) 96426-1042',
          email: 'cliente@example.com',
          neighborhood: 'Ipanema',
          consent: true,
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(database.createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'lead.email_notification.pending' }),
    });
  });

  it('assigns a lead to an eligible professional in the requested region', async () => {
    database.findUsers.mockResolvedValue([
      {
        id: 'corretor-barra',
        leadCapacity: 30,
        serviceRegions: ['Barra da Tijuca'],
        lastLeadAssignedAt: null,
        _count: { assignedLeads: 1 },
      },
      {
        id: 'corretor-leblon',
        leadCapacity: 10,
        serviceRegions: ['Leblon'],
        lastLeadAssignedAt: null,
        _count: { assignedLeads: 2 },
      },
    ]);

    const response = await POST(
      new Request('http://localhost/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Cliente orgânico',
          phone: '(21) 96426-1042',
          email: 'cliente@example.com',
          neighborhood: 'Leblon',
          consent: true,
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(database.createLead).toHaveBeenCalledWith({
      data: expect.objectContaining({ assignedToId: 'corretor-leblon' }),
    });
    expect(database.updateUser).toHaveBeenCalledWith({
      where: { id: 'corretor-leblon' },
      data: { lastLeadAssignedAt: expect.any(Date) },
    });
  });

  it('keeps a lead in the management queue if the region has no eligible professional', async () => {
    database.findUsers.mockResolvedValue([
      {
        id: 'corretor-barra',
        leadCapacity: 30,
        serviceRegions: ['Barra da Tijuca'],
        lastLeadAssignedAt: null,
        _count: { assignedLeads: 1 },
      },
    ]);
    const response = await POST(
      new Request('http://localhost/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Cliente orgânico',
          phone: '(21) 96426-1042',
          email: 'cliente@example.com',
          neighborhood: 'Leblon',
          consent: true,
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(database.createLead).toHaveBeenCalledWith({
      data: expect.objectContaining({ assignedToId: null }),
    });
    expect(database.updateUser).not.toHaveBeenCalled();
  });

  it('keeps a lead without neighborhood out of a regional-only queue', async () => {
    database.findUsers.mockResolvedValue([
      {
        id: 'regional',
        leadCapacity: 30,
        serviceRegions: ['Leblon'],
        lastLeadAssignedAt: null,
        _count: { assignedLeads: 0 },
      },
    ]);
    const response = await POST(
      new Request('http://localhost/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Cliente',
          phone: '(21) 96426-1042',
          email: 'cliente@example.com',
          consent: true,
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(database.createLead).toHaveBeenCalledWith({
      data: expect.objectContaining({ assignedToId: null }),
    });
    expect(database.updateUser).not.toHaveBeenCalled();
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
