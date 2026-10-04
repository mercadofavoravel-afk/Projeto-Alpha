import { describe, expect, it } from 'vitest';

import {
  createArticleLeadSource,
  getArticleNeighborhood,
  resolveArticleNeighborhood,
} from './article-origin';

describe('article origin', () => {
  it('identifies the neighborhood from an article title', () => {
    expect(getArticleNeighborhood('Por que investir em Ipanema')).toBe('Ipanema');
    expect(getArticleNeighborhood('Como escolher um imóvel na Gávea')).toBe('Gávea');
    expect(getArticleNeighborhood('Studios no Porto Maravilha')).toBe('Porto Maravilha');
    expect(getArticleNeighborhood('Morar em Jacarepaguá')).toBe('Jacarepaguá');
    expect(getArticleNeighborhood('Imóveis no Recreio')).toBe('Recreio dos Bandeirantes');
    expect(getArticleNeighborhood('A Praia do Pepê e a Barra')).toBe('Barra da Tijuca');
    expect(getArticleNeighborhood('Imóveis na Tijuca')).toBe('Tijuca');
    expect(getArticleNeighborhood('Apartamento no Alto Leblon')).toBe('Leblon');
  });

  it('keeps a generic city origin when an article is not about one neighborhood', () => {
    expect(getArticleNeighborhood('Imóvel novo ou pronto: qual opção escolher')).toBe(
      'Rio de Janeiro',
    );
  });

  it('uses the editorial category before incidental neighborhood references in the article', () => {
    expect(
      resolveArticleNeighborhood('Barra da Tijuca', 'Kronos Barra: apartamentos e coberturas'),
    ).toBe('Barra da Tijuca');
    expect(
      resolveArticleNeighborhood('Ipanema', 'Compare também o Leblon e a Barra da Tijuca'),
    ).toBe('Ipanema');
    expect(resolveArticleNeighborhood(null, 'Studio no Porto Maravilha')).toBe('Porto Maravilha');
  });

  it('creates a compact CRM source label', () => {
    expect(createArticleLeadSource('Investir em Ipanema', 'Ipanema')).toBe(
      'Conteúdo | artigo: Investir em Ipanema | região: Ipanema',
    );
  });
});
