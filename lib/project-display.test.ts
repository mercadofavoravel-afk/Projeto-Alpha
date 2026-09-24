import { describe, expect, it } from 'vitest';
import { projectDisplay } from './project-display';

describe('published catalog copy', () => {
  it('corrects the legacy Kronos name and keeps new book details visible with old database copy', () => {
    const result = projectDisplay({
      slug: 'cronos-barra',
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
});
