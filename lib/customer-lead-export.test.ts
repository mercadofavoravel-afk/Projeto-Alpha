import { describe, expect, it } from 'vitest';

import {
  customerLeadWhere,
  customerLeadsToCsv,
  parseCustomerLeadFilters,
} from './customer-lead-export';

describe('customer lead filters and export', () => {
  it('normalizes supported status, search text, and calendar dates', () => {
    expect(
      parseCustomerLeadFilters({
        status: 'CONTACTED',
        q: '  Ipanema  ',
        from: '2026-10-01',
        to: '2026-10-14',
      }),
    ).toEqual({
      status: 'CONTACTED',
      query: 'Ipanema',
      from: '2026-10-01',
      to: '2026-10-14',
    });
  });

  it('ignores invalid statuses and dates and caps search input', () => {
    const parsed = parseCustomerLeadFilters({
      status: 'ADMIN',
      q: 'x'.repeat(200),
      from: '2026-02-30',
      to: 'yesterday',
    });
    expect(parsed.status).toBeUndefined();
    expect(parsed.from).toBeUndefined();
    expect(parsed.to).toBeUndefined();
    expect(parsed.query).toHaveLength(120);
  });

  it('scopes results to the requested site and combines filters', () => {
    expect(
      customerLeadWhere('site_alpha', {
        status: 'NEW',
        query: 'Barra',
        from: '2026-10-01',
        to: '2026-10-14',
      }),
    ).toEqual({
      siteId: 'site_alpha',
      AND: [
        { status: 'NEW' },
        {
          createdAt: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lt: new Date('2026-10-15T00:00:00.000Z'),
          },
        },
        {
          OR: [
            { name: { contains: 'Barra', mode: 'insensitive' } },
            { phone: { contains: 'Barra', mode: 'insensitive' } },
            { email: { contains: 'Barra', mode: 'insensitive' } },
            { source: { contains: 'Barra', mode: 'insensitive' } },
            {
              article: {
                is: { title: { contains: 'Barra', mode: 'insensitive' } },
              },
            },
          ],
        },
      ],
    });
  });

  it('quotes CSV cells and neutralizes spreadsheet formula prefixes', () => {
    const csv = customerLeadsToCsv([
      {
        createdAt: new Date('2026-10-14T10:00:00.000Z'),
        name: '=1+1',
        phone: '+5511999999999',
        email: 'lead@example.com',
        objective: 'INVEST',
        status: 'NEW',
        source: 'Artigo, Ipanema',
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        article: { title: 'Studios "premium"' },
      },
    ]);
    expect(csv.startsWith('\uFEFF"Data de entrada"')).toBe(true);
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('"\'+5511999999999"');
    expect(csv).toContain('"Artigo, Ipanema"');
    expect(csv).toContain('"Studios ""premium"""');
  });
});
