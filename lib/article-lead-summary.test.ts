import { describe, expect, it } from 'vitest';
import { summarizeArticleLeads } from './article-lead-summary';

describe('article lead attribution', () => {
  it('counts distinct article slugs even when the legacy source title is truncated alike', () => {
    expect(
      summarizeArticleLeads([
        { articleSlug: 'planta-a', source: 'Orgânico | artigo: Planta familiar | região: Ipanema' },
        { articleSlug: 'planta-b', source: 'Orgânico | artigo: Planta familiar | região: Ipanema' },
        { articleSlug: 'planta-a', source: 'Orgânico | artigo: Planta familiar | região: Ipanema' },
        { articleSlug: null, source: 'Orgânico | artigo: Artigo antigo | região: Leblon' },
      ]),
    ).toEqual([
      { slug: 'planta-a', label: 'planta-a', count: 2 },
      { slug: null, label: 'Artigo antigo', count: 1 },
      { slug: 'planta-b', label: 'planta-b', count: 1 },
    ]);
  });
});
