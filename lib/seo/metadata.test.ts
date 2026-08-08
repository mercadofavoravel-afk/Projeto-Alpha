import { afterEach, describe, expect, it } from 'vitest';
import { createMetadata } from './metadata';

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe('createMetadata', () => {
  it('gera canonical, Open Graph e Twitter Card', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://alpha.example.com';

    const metadata = createMetadata({
      title: 'Vista Mar',
      description: 'Empreendimento residencial com localização privilegiada.',
      path: '/empreendimentos/vista-mar',
      image: '/images/vista-mar.jpg',
    });

    expect(metadata.alternates?.canonical).toBe(
      'https://alpha.example.com/empreendimentos/vista-mar',
    );
    expect(metadata.openGraph?.images).toEqual([
      {
        url: 'https://alpha.example.com/images/vista-mar.jpg',
        alt: 'Vista Mar',
      },
    ]);
    expect(metadata.openGraph?.siteName).toBe('Imóveis de Alto Padrão Rio');
    expect(metadata.twitter?.card).toBe('summary_large_image');
  });

  it('usa a imagem padrão quando nenhuma imagem é informada', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://alpha.example.com';
    const metadata = createMetadata({
      title: 'Coleções',
      description: 'Coleções de imóveis selecionados.',
      path: '/colecoes',
    });

    expect(metadata.twitter?.images).toEqual(['https://alpha.example.com/images/vie-01.jpg']);
  });

  it('marca páginas privadas como não indexáveis', () => {
    const metadata = createMetadata({
      title: 'Área privada',
      description: 'Conteúdo restrito.',
      noIndex: true,
    });

    expect(metadata.robots).toEqual({ index: false, follow: false, nocache: true });
  });
});
