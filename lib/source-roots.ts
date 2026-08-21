import 'server-only';

export type SourceRootKind =
  | 'owned'
  | 'developer'
  | 'market';

export type SourceRoot = {
  id: string;
  name: string;
  url: string;
  kind: SourceRootKind;
  enabled: boolean;
  priority: number;
  city?: string;
  notes?: string;
};

export const sourceRoots: SourceRoot[] = [
  {
    id: 'imoveis-alto-padrao-rio',
    name: 'Imóveis de Alto Padrão Rio',
    url: 'https://www.imoveisdealtopadraorio.com.br',
    kind: 'owned',
    enabled: true,
    priority: 100,
    city: 'Rio de Janeiro',
    notes:
      'Fonte própria. Usar para mapear o catálogo já publicado e preservar URLs e inteligência existente.',
  },

  {
    id: 'mozak',
    name: 'Mozak',
    url: 'https://mozak.rio',
    kind: 'developer',
    enabled: true,
    priority: 95,
    city: 'Rio de Janeiro',
    notes:
      'Fonte oficial de empreendimentos de alto padrão, principalmente na Zona Sul do Rio.',
  },

  {
    id: 'opportunity-imobiliario',
    name: 'Opportunity Imobiliário',
    url: 'https://www.opportunity.com.br/Home/InvestimentosImobiliarios',
    kind: 'developer',
    enabled: true,
    priority: 95,
    city: 'Rio de Janeiro',
    notes:
      'Fonte institucional oficial para projetos imobiliários e lançamentos Opportunity.',
  },

  {
    id: 'brix',
    name: 'Brix',
    url: 'http://www.brixfii.com.br',
    kind: 'developer',
    enabled: true,
    priority: 95,
    city: 'Rio de Janeiro',
    notes:
      'Fonte institucional da Brix para projetos de incorporação imobiliária.',
  },

  {
    id: 'tegra',
    name: 'Tegra Incorporadora',
    url: 'https://www.tegraincorporadora.com.br',
    kind: 'developer',
    enabled: true,
    priority: 95,
    city: 'Rio de Janeiro',
    notes:
      'Fonte oficial Tegra para empreendimentos e lançamentos no Rio de Janeiro.',
  },
];

export function getEnabledSourceRoots() {
  return sourceRoots
    .filter((source) => source.enabled)
    .sort(
      (a, b) =>
        b.priority - a.priority,
    );
}

export function getDeveloperSourceRoots() {
  return getEnabledSourceRoots().filter(
    (source) =>
      source.kind === 'developer',
  );
}

export function getSourceRootById(
  id: string,
) {
  return sourceRoots.find(
    (source) => source.id === id,
  );
}

export function getSourceRootByUrl(
  value: string,
) {
  try {
    const target =
      new URL(value);

    const targetHost =
      target.hostname.replace(
        /^www\./,
        '',
      );

    return sourceRoots.find(
      (source) => {
        try {
          const sourceHost =
            new URL(
              source.url,
            ).hostname.replace(
              /^www\./,
              '',
            );

          return (
            sourceHost ===
            targetHost
          );
        } catch {
          return false;
        }
      },
    );
  } catch {
    return undefined;
  }
}
