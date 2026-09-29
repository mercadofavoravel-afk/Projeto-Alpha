import { describe, expect, it } from 'vitest';

import { articleContentBlocks, articleContentSegments } from './article-links';

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

  it('accepts an official WordPress link on the apex domain', () => {
    expect(
      articleContentSegments('Veja https://imoveisdealtopadraorio.com.br/green-park/'),
    ).toEqual([
      { text: 'Veja ' },
      {
        text: 'https://imoveisdealtopadraorio.com.br/green-park/',
        href: 'https://imoveisdealtopadraorio.com.br/green-park/',
      },
    ]);
  });

  it('renders editorial headings and lists as separate blocks', () => {
    expect(
      articleContentBlocks(
        '## Como comparar\n\n- Área privativa\n- Custos\n\n1. Confirme a planta\n2. Visite o local',
      ),
    ).toEqual([
      { kind: 'heading', lines: ['Como comparar'] },
      { kind: 'list', lines: ['Área privativa', 'Custos'] },
      { kind: 'ordered-list', lines: ['Confirme a planta', 'Visite o local'] },
    ]);
  });

  it('uses the label of an official Markdown link and does not link outside domains', () => {
    expect(
      articleContentSegments(
        'Veja [Kronos Barra](https://imoveisdealtopadraorio.com.br/alpha/empreendimentos/kronos-barra) e [fonte](https://example.com).',
      ),
    ).toEqual([
      { text: 'Veja ' },
      {
        text: 'Kronos Barra',
        href: 'https://imoveisdealtopadraorio.com.br/alpha/empreendimentos/kronos-barra',
      },
      { text: ' e ' },
      { text: 'fonte (https://example.com)' },
      { text: '.' },
    ]);
  });
});
