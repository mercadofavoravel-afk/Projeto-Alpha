import { describe, expect, it } from 'vitest';

import { findInvalidEditorialDestinations } from './editorial-destination';

describe('editorial destinations', () => {
  it('accepts only the official site, WhatsApp and email', () => {
    const content = [
      'Conheça nossos imóveis em https://www.imoveisdealtopadraorio.com.br/artigos/investir-em-ipanema.',
      'Fale agora em https://wa.me/5521964261042 ou mailto:contato@imoveisdealtopadraorio.com.br.',
    ].join(' ');

    expect(findInvalidEditorialDestinations(content)).toEqual([]);
  });

  it('flags external destinations before public publication', () => {
    expect(
      findInvalidEditorialDestinations(
        'Leia a referência em https://incorporadora-exemplo.com.br/lancamento.',
      ),
    ).toEqual(['https://incorporadora-exemplo.com.br/lancamento']);
  });
});
