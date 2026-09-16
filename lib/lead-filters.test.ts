import { buildLeadWhere, parseLeadFilters, statusLabel } from './lead-filters';

import { describe, expect, it } from 'vitest';

describe('lead filters', () => {
  it('keeps only supported filters', () => {
    expect(
      parseLeadFilters({
        channel: 'organic',
        campaign: ' Forms Leads Ipanema ',
        status: 'QUALIFIED',
      }),
    ).toEqual({
      channel: 'organic',
      campaign: 'Forms Leads Ipanema',
      status: 'QUALIFIED',
    });

    expect(parseLeadFilters({ channel: 'unknown', status: 'INVALID' })).toEqual({});
  });

  it('builds a safe CRM query for organic leads', () => {
    expect(
      buildLeadWhere({
        channel: 'organic',
        campaign: 'ipanema',
        status: 'QUALIFIED',
      }),
    ).toEqual({
      source: {
        startsWith: 'Orgânico | artigo:',
      },
      status: 'QUALIFIED',
      utmCampaign: {
        contains: 'ipanema',
        mode: 'insensitive',
      },
    });
  });

  it('labels CRM stages in Portuguese', () => {
    expect(statusLabel('VISIT_SCHEDULED')).toBe('Visita agendada');
  });
});
