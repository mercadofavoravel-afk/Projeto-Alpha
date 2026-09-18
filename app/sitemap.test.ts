import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  project: {
    findMany: vi.fn(),
  },
  neighborhood: {
    findMany: vi.fn(),
  },
  article: {
    findMany: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  db: database,
}));

vi.mock('@/lib/seo', () => ({
  buildCanonical: (path: string) => `https://www.imoveisdealtopadraorio.com.br${path}`,
}));

import sitemap from './sitemap';

describe('sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    database.project.findMany.mockResolvedValue([
      {
        slug: 'residencial-ipanema',
        updatedAt: new Date('2026-09-18T00:00:00.000Z'),
      },
    ]);
    database.neighborhood.findMany.mockResolvedValue([
      {
        slug: 'ipanema',
        updatedAt: new Date('2026-09-17T00:00:00.000Z'),
      },
    ]);
    database.article.findMany.mockResolvedValue([
      {
        slug: 'investir-em-ipanema',
        updatedAt: new Date('2026-09-16T00:00:00.000Z'),
      },
    ]);
  });

  it('lists published content and public neighborhood pages', async () => {
    await expect(sitemap()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: 'https://www.imoveisdealtopadraorio.com.br/empreendimentos/residencial-ipanema',
          priority: 0.8,
        }),
        expect.objectContaining({
          url: 'https://www.imoveisdealtopadraorio.com.br/bairros/ipanema',
          priority: 0.75,
        }),
        expect.objectContaining({
          url: 'https://www.imoveisdealtopadraorio.com.br/artigos/investir-em-ipanema',
          priority: 0.7,
        }),
      ]),
    );
  });
});
