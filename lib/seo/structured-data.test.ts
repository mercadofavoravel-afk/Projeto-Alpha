import { afterEach, describe, expect, it } from 'vitest';
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  projectJsonLd,
  serializeJsonLd,
  websiteJsonLd,
} from './structured-data';

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe('structured data', () => {
  it('não usa foto de empreendimento como logomarca da imobiliária', () => {
    expect(organizationJsonLd()).not.toHaveProperty('logo');
  });

  it('gera WebSite com ação de busca', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://alpha.example.com';
    const schema = websiteJsonLd();

    expect(schema['@type']).toBe('WebSite');
    expect(schema.potentialAction.target).toContain('/buscar?q={search_term_string}');
  });

  it('gera breadcrumbs com URLs canônicas', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://alpha.example.com';
    const schema = breadcrumbJsonLd([
      { name: 'Início', path: '/' },
      { name: 'Vista Mar', path: '/empreendimentos/vista-mar' },
    ]);

    expect(schema.itemListElement[1]).toMatchObject({
      position: 2,
      item: 'https://alpha.example.com/empreendimentos/vista-mar',
    });
  });

  it('gera dados estruturados do empreendimento', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://alpha.example.com';
    const schema = projectJsonLd({
      name: 'Vista Mar',
      slug: 'vista-mar',
      description: 'Residência próxima ao mar.',
      image: '/images/vista.jpg',
      neighborhood: 'Ipanema',
      status: 'Consultar',
      types: ['Apartamento'],
      highlights: ['Frente-mar'],
    });

    expect(schema['@type']).toBe('Residence');
    expect(schema.image).toBe('https://alpha.example.com/images/vista.jpg');
    expect(schema.address.addressNeighborhood).toBe('Ipanema');
  });

  it('não anuncia a página inicial como imagem quando o empreendimento não tem foto', () => {
    const schema = projectJsonLd({
      name: 'Vista Mar',
      slug: 'vista-mar',
      description: 'Residência próxima ao mar.',
      image: '',
      neighborhood: 'Ipanema',
      status: 'Consultar',
      types: ['Apartamento'],
      highlights: [],
    });

    expect(schema).not.toHaveProperty('image');
  });

  it('escapa tags HTML na serialização', () => {
    expect(serializeJsonLd({ value: '</script>' })).not.toContain('</script>');
  });
});
