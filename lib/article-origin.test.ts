import { describe, expect, it } from 'vitest';

import { createOrganicArticleSource, getArticleNeighborhood } from './article-origin';

describe('article origin', () => {
  it('identifies the neighborhood from an article title', () => {
    expect(getArticleNeighborhood('Por que investir em Ipanema')).toBe('Ipanema');
    expect(getArticleNeighborhood('Como escolher um imóvel na Gávea')).toBe('Gávea');
    expect(getArticleNeighborhood('Studios no Porto Maravilha')).toBe('Porto Maravilha');
    expect(getArticleNeighborhood('Morar em Jacarepaguá')).toBe('Jacarepaguá');
    expect(getArticleNeighborhood('Imóveis no Recreio')).toBe('Recreio dos Bandeirantes');
    expect(getArticleNeighborhood('A Praia do Pepê e a Barra')).toBe('Barra da Tijuca');
    expect(getArticleNeighborhood('Imóveis na Tijuca')).toBe('Tijuca');
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
