import type { MetadataRoute } from 'next';
import { alphaPath } from '@/lib/public-path';
import { buildCanonical } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      allow: alphaPath('/'),
      disallow: ['/admin/', '/api/', '/login', '/recuperar-senha', '/redefinir-senha'].map(alphaPath),
    }],
    sitemap: buildCanonical('/sitemap.xml'),
    host: buildCanonical('/'),
  };
}
