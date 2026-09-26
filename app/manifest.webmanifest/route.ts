import type { MetadataRoute } from 'next';
import { NextResponse } from 'next/server';

import { alphaPath } from '@/lib/public-path';

export function GET() {
  const manifest: MetadataRoute.Manifest = {
    id: alphaPath('/admin'),
    name: 'Projeto Alpha · Painel',
    short_name: 'Alpha',
    description: 'Painel de conteúdos, equipe e CRM do Projeto Alpha.',
    start_url: alphaPath('/admin'),
    scope: alphaPath('/'),
    display: 'standalone',
    background_color: '#f4efe6',
    theme_color: '#173128',
    lang: 'pt-BR',
    icons: [
      {
        src: alphaPath('/icons/alpha-192.png'),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: alphaPath('/icons/alpha-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: alphaPath('/icons/alpha-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
}
