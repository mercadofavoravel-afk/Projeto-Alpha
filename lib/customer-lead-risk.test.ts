import { describe, expect, it } from 'vitest';

import { customerLeadRiskQueries } from './customer-lead-risk';

describe('commercial CRM risk scope', () => {
  it('limits every alert to the connected customer site', () => {
    const queries = customerLeadRiskQueries('site-a', new Date('2026-10-10T12:00:00Z'));
    for (const where of Object.values(queries)) {
      expect(where.AND).toEqual(
        expect.arrayContaining([expect.objectContaining({ siteId: 'site-a' })]),
      );
    }
  });

  it('uses distinct first-contact and stalled windows with registered contacts', () => {
    const queries = customerLeadRiskQueries('site-a', new Date('2026-10-10T12:00:00Z'));
    expect(queries.firstContact.AND).toEqual(
      expect.arrayContaining([
        { createdAt: { lt: new Date('2026-10-10T11:45:00Z') } },
        {
          activities: {
            none: {
              type: { in: ['CALL', 'WHATSAPP', 'EMAIL', 'VISIT'] },
              completedAt: { not: null },
            },
          },
        },
      ]),
    );
    expect(queries.stalled.AND).toEqual(
      expect.arrayContaining([{ createdAt: { lt: new Date('2026-10-08T12:00:00Z') } }]),
    );
  });
});
