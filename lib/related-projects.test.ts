import { describe, expect, it } from 'vitest';

import { relatedProjectsForArticle } from './related-projects';

const projects = [
  { slug: 'kronos-barra', name: 'Kronos Barra', neighborhood: { name: 'Barra da Tijuca' } },
  { slug: 'green-park', name: 'Green Park', neighborhood: { name: 'Barra da Tijuca' } },
  { slug: 'vie-ipanema', name: 'VIE Ipanema', neighborhood: { name: 'Ipanema' } },
  { slug: 'parque-studios', name: 'Parque Studios', neighborhood: { name: 'Ipanema / Leblon' } },
];

describe('related projects on article pages', () => {
  it('places the product named in the article before other projects in its neighborhood', () => {
    expect(
      relatedProjectsForArticle(
        'Green Park: lazer e rotina da família',
        'Barra da Tijuca',
        projects,
      ).map((project) => project.slug),
    ).toEqual(['green-park', 'kronos-barra']);
  });

  it('does not suggest an unrelated product in a neighborhood without a published project', () => {
    expect(
      relatedProjectsForArticle('Studio no Porto Maravilha', 'Porto Maravilha', projects),
    ).toEqual([]);
  });

  it('recognizes a project shared by two neighborhoods', () => {
    expect(
      relatedProjectsForArticle('Studio no Leblon', 'Leblon', projects).map(
        (project) => project.slug,
      ),
    ).toEqual(['parque-studios']);
  });
});
