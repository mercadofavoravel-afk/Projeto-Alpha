import type { MetadataRoute } from 'next';
import { projects } from '@/lib/projects';
export default function sitemap(): MetadataRoute.Sitemap {
  const b = 'https://www.imoveisdealtopadraorio.com.br';
  return [
    { url: b, lastModified: new Date() },
    ...projects.map((p) => ({ url: `${b}/empreendimentos/${p.slug}`, lastModified: new Date() })),
  ];
}
