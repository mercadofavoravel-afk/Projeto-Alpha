import type { MetadataRoute } from 'next';
import { projects } from '@/lib/projects';
import { buildCanonical } from '@/lib/seo';

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

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticRoutes.map((route) => ({
      url: buildCanonical(route.path),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),

    ...projects.map((project) => ({
      url: buildCanonical(`/empreendimentos/${project.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
