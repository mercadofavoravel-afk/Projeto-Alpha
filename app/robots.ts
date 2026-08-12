import type { MetadataRoute } from 'next';
import { buildCanonical } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/login',
          '/recuperar-senha',
          '/redefinir-senha',
        ],
      },
    ],
    sitemap: buildCanonical('/sitemap.xml'),
    host: buildCanonical('/'),
  };
}
