import { describe, expect, it } from 'vitest';
import { summarizeLeadOrigins } from './lead-origin-summary';

describe('CRM origin summary', () => {
  it('counts the whole filtered set and combines groups sharing the same content', () => {
    const summary = summarizeLeadOrigins([
      {
        source: 'Orgânico | artigo: Comprar em Ipanema | região: Ipanema',
        neighborhood: 'Ipanema',
        _count: { _all: 70 },
      },
      {
        source: 'Orgânico | artigo: Comprar em Ipanema | região: Leblon',
        neighborhood: 'Leblon',
        _count: { _all: 45 },
      },
      {
        source: 'Campanha: Google',
        neighborhood: 'Leblon',
        _count: { _all: 25 },
      },
    ]);

    expect(summary).toEqual({
      total: 140,
      contentLeads: 115,
      contentCount: 1,
      regionCount: 2,
      byContent: [{ label: 'Comprar em Ipanema', count: 115 }],
      byRegion: [
        { label: 'Ipanema', count: 70 },
        { label: 'Leblon', count: 45 },
      ],
    });
  });
});
