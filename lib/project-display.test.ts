import { describe, expect, it } from 'vitest';
import { projectDisplay } from './project-display';

describe('published catalog copy', () => {
  it('corrects the legacy Kronos name and keeps new book details visible with old database copy', () => {
    const result = projectDisplay({
      slug: 'kronos-barra',
      name: 'Cronos Barra',
      description: '2, 3 e 4 quartos · rooftop e lazer',
      types: ['2 quartos'],
      highlights: [],
    });

    expect(result.name).toBe('Kronos Barra');
    expect(result.description).toContain('77 a 301 m²');
    expect(result.types).toContain('4 quartos');
  });

  it('shows Stay area in the catalog even with the old database description', () => {
    const result = projectDisplay({
      slug: 'stay-360-leblon',
      name: 'Stay 360 Leblon',
      description: 'Studios, gardens e coberturas',
      types: [],
      highlights: [],
    });
    expect(result.description).toContain('28 a 50 m²');
  });

  it('shows developer-confirmed Copacabana typologies even with the old database copy', () => {
    const result = projectDisplay({
      slug: 'be-in-rio-copacabana',
      name: 'Be.in.Rio Copacabana',
      description: 'Apartamentos, doubles e coberturas',
      types: ['Apartamento', 'Double', 'Cobertura'],
      highlights: [],
    });
    expect(result.description).toContain('37,12 a 153,24 m²');
    expect(result.types).toContain('Up garden');
  });

  it('replaces outdated Soul and Paradís typologies from a published database', () => {
    const legacy = {
      name: 'Empreendimento',
      description: 'Studios, 2 quartos e coberturas',
      types: ['Studio', 'Cobertura'],
      highlights: [],
    };
    const soul = projectDisplay({ slug: 'soul-rio-gago-coutinho', ...legacy });
    const paradis = projectDisplay({ slug: 'paradis-mozak', ...legacy });
    expect(soul.description).toContain('27,81 a 82,65 m²');
    expect(soul.types).toEqual(['Studio', 'Garden', '2 quartos com suíte']);
    expect(paradis.description).toContain('62 a 147 m²');
    expect(paradis.types).toEqual(['2 quartos', '3 quartos']);
  });
});
