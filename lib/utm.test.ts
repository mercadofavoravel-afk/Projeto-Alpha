import { describe, expect, it } from 'vitest';

import { normalizeLeadUtms, normalizeUtmValue } from './utm';

describe('UTM normalization', () => {
  it('normalizes a campaign using the standard CRM format', () => {
    expect(normalizeUtmValue('[FORMS] Leads Epic Golf 29.07.26')).toBe(
      'forms_leads_epic_golf_29_07_26',
    );
  });

  it('normalizes source and medium while preserving empty values as undefined', () => {
    expect(
      normalizeLeadUtms({
        utmSource: ' Google ',
        utmMedium: 'Paid Social',
        utmCampaign: '   ',
      }),
    ).toEqual({
      utmSource: 'google',
      utmMedium: 'paid_social',
      utmCampaign: undefined,
    });
  });
});
