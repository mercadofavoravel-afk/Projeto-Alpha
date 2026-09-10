import type { MetadataRoute } from 'next';
import { projects } from '@/lib/projects';
import { SITE_CONFIG, siteUrl } from '@/lib/site-config';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_CONFIG.url, lastModified: new Date() },
    ...projects.map((p) => ({
      url: siteUrl(`/empreendimentos/${p.slug}`),
      lastModified: new Date(),
    })),
  ];
}
