import { describe, expect, it } from 'vitest';

import { classifySourceUrl } from './source-discovery';

describe('source discovery classification', () => {
  it('treats Zona Sul as a neighborhood landing page', () => {
    expect(
      classifySourceUrl(
        'https://www.imoveisdealtopadraorio.com.br/zona-sul',
        'Imóveis de alto padrão na Zona Sul',
      ),
    ).toEqual({
      kind: 'neighborhood',
      score: 45,
    });
  });

  it('prioritizes a specific Alpha product over generic location signals', () => {
    expect(
      classifySourceUrl(
        'https://www.imoveisdealtopadraorio.com.br/gloria-residencial',
        'Glória Residencial | Imóveis lançamento',
      ),
    ).toEqual({
      kind: 'project',
      score: 75,
    });
  });

  it('does not treat Linktree document-like paths as commercial documents', () => {
    expect(classifySourceUrl('https://linktr.ee/tech.doc', null)).toEqual({
      kind: 'other',
      score: 20,
    });
  });

  it('keeps commercial documents above institutional documents', () => {
    expect(classifySourceUrl('https://materiais.exemplo.com/book-apresentacao.pdf', null)).toEqual({
      kind: 'document',
      score: 75,
    });

    expect(
      classifySourceUrl('https://materiais.exemplo.com/politica-privacidade.pdf', null),
    ).toEqual({
      kind: 'document',
      score: 10,
    });
  });
});
