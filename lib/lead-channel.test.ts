import { describe, expect, it } from 'vitest';

import { channelFromLead } from './lead-channel';

describe('lead channel', () => {
  it('uses the measured platform even for a visitor who read an article', () => {
    expect(channelFromLead({ utmSource: 'google', utmMedium: 'cpc' })).toBe('google / cpc');
  });

  it('does not call an unidentified visit direct or organic', () => {
    expect(channelFromLead({ utmSource: null, utmMedium: null })).toBe(
      'Plataforma não identificada',
    );
    expect(channelFromLead({ utmSource: null, utmMedium: 'organic' })).toBe(
      'Busca orgânica (plataforma não identificada)',
    );
  });
});
