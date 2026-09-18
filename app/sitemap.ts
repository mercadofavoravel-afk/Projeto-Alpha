import type { MetadataRoute } from 'next';

import { db } from '@/lib/db';
import { buildCanonical } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const staticRoutes = [
  {
    path: '/',
    changeFrequency: 'weekly' as const,
    priority: 1,
  },
  {
    path: '/empreendimentos',
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  },
  {
    path: '/colecoes',
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  },
  {
    path: '/artigos',
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  },
  {
    path: '/buscar',
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  },
  {
    path: '/descubra',
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, neighborhoods, articles] = await Promise.all([
    db.project.findMany({
      where: {
        publishStatus: 'PUBLISHED',
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
    db.neighborhood.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
    db.article.findMany({
      where: {
        publishStatus: 'PUBLISHED',
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
  ]);

  return [
    ...staticRoutes.map((route) => ({
      url: buildCanonical(route.path),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...projects.map((project) => ({
      url: buildCanonical(`/empreendimentos/${project.slug}`),
      lastModified: project.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...neighborhoods.map((neighborhood) => ({
      url: buildCanonical(`/bairros/${neighborhood.slug}`),
      lastModified: neighborhood.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),
    ...articles.map((article) => ({
      url: buildCanonical(`/artigos/${article.slug}`),
      lastModified: article.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
