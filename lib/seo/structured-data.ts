import { buildCanonical } from './canonical';
import { siteConfig } from './site';

export type JsonLdValue = Record<string, unknown> | Record<string, unknown>[];

export function serializeJsonLd(value: JsonLdValue) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: siteConfig.name,
    url: buildCanonical('/'),
    logo: buildCanonical(siteConfig.defaultImage),
    areaServed: {
      '@type': 'City',
      name: 'Rio de Janeiro',
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: buildCanonical('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${buildCanonical('/buscar')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildCanonical(item.path),
    })),
  };
}

type ProjectSchemaInput = {
  name: string;
  slug: string;
  description: string;
  image: string;
  neighborhood: string;
  status: string;
  types: string[];
  highlights: string[];
};

export function projectJsonLd(project: ProjectSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Residence',
    name: project.name,
    url: buildCanonical(`/empreendimentos/${project.slug}`),
    description: project.description,
    image: buildCanonical(project.image),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Rio de Janeiro',
      addressRegion: 'RJ',
      addressCountry: 'BR',
      addressNeighborhood: project.neighborhood,
    },
    amenityFeature: project.highlights.map((highlight) => ({
      '@type': 'LocationFeatureSpecification',
      name: highlight,
      value: true,
    })),
    additionalType: project.types,
    additionalProperty: {
      '@type': 'PropertyValue',
      name: 'Disponibilidade',
      value: project.status,
    },
  };
}
