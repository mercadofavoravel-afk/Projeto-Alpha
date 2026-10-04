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

  it('uses measured UTM medium for the organic filter', () => {
    expect(
      buildLeadWhere({
        channel: 'organic',
        campaign: 'ipanema',
        status: 'QUALIFIED',
      }),
    ).toEqual({
      utmMedium: 'organic',
      status: 'QUALIFIED',
      utmCampaign: {
        contains: 'ipanema',
        mode: 'insensitive',
      },
    });
  });

  it('keeps a campaign term when the campaign channel is selected', () => {
    expect(buildLeadWhere({ channel: 'campaign', campaign: 'ipanema' })).toEqual({
      utmCampaign: { contains: 'ipanema', mode: 'insensitive' },
    });
  });

  it('labels CRM stages in Portuguese', () => {
    expect(statusLabel('VISIT_SCHEDULED')).toBe('Visita agendada');
  });
});
