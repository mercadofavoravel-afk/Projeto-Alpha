import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findSite: vi.fn(),
  findLeads: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireApiPermission: mocks.auth }));
vi.mock('@/lib/db', () => ({
  db: {
    customerSite: { findFirst: mocks.findSite },
    customerLead: { findMany: mocks.findLeads },
  },
}));

import { GET } from './route';

const context = { params: Promise.resolve({ id: 'site_customer_01' }) };

function request(query = '') {
  return new Request(
    `https://alpha.example/api/customer-sites/site_customer_01/leads/export${query}`,
  );
}

describe('licensed customer lead CSV export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      ok: true,
      user: { id: 'licensed-owner' },
    });
    mocks.findSite.mockResolvedValue({ id: 'site_customer_01' });
    mocks.findLeads.mockResolvedValue([
      {
        createdAt: new Date('2026-10-14T13:00:00.000Z'),
        name: 'Cliente teste',
        phone: '+5521999999999',
        email: 'cliente@example.com',
        objective: 'INVEST',
        status: 'NEW',
        source: 'Artigo',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'ipanema',
        article: { title: 'Studios em Ipanema' },
      },
    ]);
  });

  it('denies export when the requested site belongs to another account', async () => {
    mocks.findSite.mockResolvedValue(null);
    const response = await GET(request(), context);

    expect(response.status).toBe(404);
    expect(mocks.findSite).toHaveBeenCalledWith({
      where: { id: 'site_customer_01', ownerId: 'licensed-owner' },
      select: { id: true },
    });
    expect(mocks.findLeads).not.toHaveBeenCalled();
  });

  it('exports only the authorized site and preserves the selected filters', async () => {
    const response = await GET(
      request('?status=NEW&q=Ipanema&from=2026-10-01&to=2026-10-14'),
      context,
    );
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(mocks.findLeads).toHaveBeenCalledWith({
      where: {
        siteId: 'site_customer_01',
        AND: [
          { status: 'NEW' },
          {
            createdAt: {
              gte: new Date('2026-10-01T03:00:00.000Z'),
              lt: new Date('2026-10-15T03:00:00.000Z'),
            },
          },
          {
            OR: [
              { name: { contains: 'Ipanema', mode: 'insensitive' } },
              { phone: { contains: 'Ipanema', mode: 'insensitive' } },
              { email: { contains: 'Ipanema', mode: 'insensitive' } },
              { source: { contains: 'Ipanema', mode: 'insensitive' } },
              { article: { is: { title: { contains: 'Ipanema', mode: 'insensitive' } } } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20_001,
      select: {
        createdAt: true,
        name: true,
        phone: true,
        email: true,
        objective: true,
        status: true,
        source: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        article: { select: { title: true } },
      },
    });
    expect(csv).toContain('Cliente teste');
    expect(csv).toContain('Studios em Ipanema');
  });

  it('requires a smaller date range when the export exceeds the safe row limit', async () => {
    mocks.findLeads.mockResolvedValue(Array.from({ length: 20_001 }, () => ({})));
    const response = await GET(request(), context);

    expect(response.status).toBe(413);
    expect(mocks.findLeads).toHaveBeenCalledWith(expect.objectContaining({ take: 20_001 }));
  });
});
