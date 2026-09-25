import { describe, expect, it } from 'vitest';

import { articleContentSegments } from './article-links';

describe('article links', () => {
  it('links only to the official site and keeps punctuation outside the anchor', () => {
    expect(
      articleContentSegments(
        'Veja https://www.imoveisdealtopadraorio.com.br/alpha/empreendimentos/vie-ipanema. Evite https://example.com/externo.',
      ),
    ).toEqual([
      { text: 'Veja ' },
      {
        text: 'https://www.imoveisdealtopadraorio.com.br/alpha/empreendimentos/vie-ipanema',
        href: 'https://www.imoveisdealtopadraorio.com.br/alpha/empreendimentos/vie-ipanema',
      },
      { text: '.' },
      { text: ' Evite ' },
      { text: 'https://example.com/externo' },
      { text: '.' },
    ]);
  });

  it('leaves regular paragraphs as plain text', () => {
    expect(articleContentSegments('Pesquisa e análise antes da compra.')).toEqual([
      { text: 'Pesquisa e análise antes da compra.' },
    ]);
  });
});
