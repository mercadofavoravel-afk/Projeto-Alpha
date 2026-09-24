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
});
