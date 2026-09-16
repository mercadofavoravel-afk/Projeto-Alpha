import { describe, expect, it } from 'vitest';

import { createOrganicArticleSource, getArticleNeighborhood } from './article-origin';

describe('article origin', () => {
  it('identifies the neighborhood from an article title', () => {
    expect(getArticleNeighborhood('Por que investir em Ipanema')).toBe('Ipanema');
    expect(getArticleNeighborhood('Como escolher um imóvel na Gávea')).toBe('Gávea');
  });

  it('keeps a generic city origin when an article is not about one neighborhood', () => {
    expect(getArticleNeighborhood('Imóvel novo ou pronto: qual opção escolher')).toBe(
      'Rio de Janeiro',
    );
  });

  it('creates a compact CRM source label', () => {
    expect(createOrganicArticleSource('Investir em Ipanema', 'Ipanema')).toBe(
      'Orgânico | artigo: Investir em Ipanema | região: Ipanema',
    );
  });
});
