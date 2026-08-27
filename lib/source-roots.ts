import 'server-only';

export type SourceRootKind =
  | 'owned'
  | 'developer'
  | 'market';

export type SourceAccessKind =
  | 'website'
  | 'link_hub'
  | 'drive'
  | 'portal';

export type SourceRoot = {
  id: string;
  name: string;
  url: string;
  kind: SourceRootKind;
  access: SourceAccessKind;
  enabled: boolean;
  priority: number;
  city?: string;
  notes?: string;
  followExternalLinks?: boolean;
};

export const sourceRoots: SourceRoot[] = [
  {
    id: 'imoveis-alto-padrao-rio',
    name: 'Imóveis de Alto Padrão Rio',
    url: 'https://www.imoveisdealtopadraorio.com.br',
    kind: 'owned',
    access: 'website',
    enabled: true,
    priority: 100,
    city: 'Rio de Janeiro',
    notes:
      'Fonte própria. Mapear catálogo publicado, URLs, empreendimentos, bairros e inteligência existente.',
    followExternalLinks: false,
  },

  {
    id: 'mozak',
    name: 'Mozak',
    url: 'https://mozak.rio',
    kind: 'developer',
    access: 'website',
    enabled: true,
    priority: 95,
    city: 'Rio de Janeiro',
    notes:
      'Fonte oficial Mozak para empreendimentos, documentos e conteúdo.',
    followExternalLinks: false,
  },

  {
    id: 'opportunity-imobiliario',
    name: 'Opportunity Imobiliário',
    url: 'https://www.opportunity.com.br/Home/InvestimentosImobiliarios',
    kind: 'developer',
    access: 'website',
    enabled: true,
    priority: 95,
    city: 'Rio de Janeiro',
    notes:
      'Fonte institucional para projetos imobiliários e lançamentos Opportunity.',
    followExternalLinks: false,
  },

  {
    id: 'brix',
    name: 'Brix',
    url: 'https://www.brixfii.com.br',
    kind: 'developer',
    access: 'website',
    enabled: false,
    priority: 95,
    city: 'Rio de Janeiro',
    notes:
      'Fonte temporariamente desativada porque o servidor recusou a conexão automatizada da Vercel em 2026-08-26. Manter a URL para futura validação e reativação.',
    followExternalLinks: false,
  },

  {
    id: 'tegra',
    name: 'Tegra Incorporadora',
    url: 'https://www.tegraincorporadora.com.br',
    kind: 'developer',
    access: 'website',
    enabled: true,
    priority: 95,
    notes:
      'Fonte oficial Tegra para empreendimentos, lançamentos, bairros, documentos e conteúdo.',
    followExternalLinks: false,
  },

  {
    id: 'brandao-consultor',
    name: 'Brandão M. Consultor',
    url: 'https://linktr.ee/brandaom.consultor',
    kind: 'market',
    access: 'link_hub',
    enabled: true,
    priority: 90,
    notes:
      'Hub comercial fornecido para descoberta de incorporadoras, empreendimentos e materiais.',
    followExternalLinks: true,
  },

  {
    id: 'tegra-conecta',
    name: 'Tegra Conecta',
    url: 'https://www.tegraconecta.com.br/',
    kind: 'developer',
    access: 'portal',
    enabled: true,
    priority: 95,
    notes:
      'Portal comercial Tegra fornecido como fonte adicional de materiais e empreendimentos.',
    followExternalLinks: true,
  },

  {
    id: 'comercial-patrimar-rio',
    name: 'Comercial Patrimar Rio',
    url: 'https://linktr.ee/comercialpatrimar.rio',
    kind: 'developer',
    access: 'link_hub',
    enabled: true,
    priority: 95,
    city: 'Rio de Janeiro',
    notes:
      'Hub comercial Patrimar Rio.',
    followExternalLinks: true,
  },

  {
    id: 'drive-1pe8gbwr',
    name: 'Drive Comercial 1PE8GBwR',
    url: 'https://drive.google.com/drive/folders/1PE8GBwRVnXzovXynyLN0B8LZYuVbYDtf?usp=drive_link',
    kind: 'market',
    access: 'drive',
    enabled: true,
    priority: 85,
    notes:
      'Pasta Google Drive fornecida como fonte de books, tabelas, plantas e materiais comerciais.',
    followExternalLinks: true,
  },

  {
    id: 'comercial-newview',
    name: 'Comercial NewView',
    url: 'https://linktr.ee/comercial.newview?utm_source=linktree_profile_share',
    kind: 'market',
    access: 'link_hub',
    enabled: true,
    priority: 90,
    notes:
      'Hub comercial NewView.',
    followExternalLinks: true,
  },

  {
    id: 'progress-inc',
    name: 'Progress Inc',
    url: 'https://linktr.ee/progress.inc',
    kind: 'developer',
    access: 'link_hub',
    enabled: true,
    priority: 92,
    notes:
      'Hub fornecido para descoberta de projetos e materiais da Progress.',
    followExternalLinks: true,
  },

  {
    id: 'sensia-barra',
    name: 'Sensia Barra',
    url: 'https://linktr.ee/sensiabarra',
    kind: 'market',
    access: 'link_hub',
    enabled: true,
    priority: 90,
    city: 'Rio de Janeiro',
    notes:
      'Hub do projeto/comercial Sensia Barra.',
    followExternalLinks: true,
  },

  {
    id: 'thainasa',
    name: 'Thainasa',
    url: 'https://thainasa.netlify.app',
    kind: 'market',
    access: 'website',
    enabled: true,
    priority: 85,
    notes:
      'Site fornecido como fonte de links e materiais imobiliários.',
    followExternalLinks: true,
  },

  {
    id: 'niemeyer-360-linktree',
    name: 'Niemeyer 360',
    url: 'https://linktr.ee/niemeyer360',
    kind: 'market',
    access: 'link_hub',
    enabled: true,
    priority: 92,
    city: 'Rio de Janeiro',
    notes:
      'Hub comercial do empreendimento Niemeyer 360.',
    followExternalLinks: true,
  },

  {
    id: 'materiais-ig-corretor',
    name: 'Materiais IG Corretor',
    url: 'https://linktr.ee/materialsigcorretor',
    kind: 'market',
    access: 'link_hub',
    enabled: true,
    priority: 88,
    notes:
      'Hub de materiais para corretores e descoberta de fontes imobiliárias.',
    followExternalLinks: true,
  },

  {
    id: 'riva-incorporadora-rio',
    name: 'Riva Incorporadora Rio',
    url: 'https://linktr.ee/rivaincorporadorario',
    kind: 'developer',
    access: 'link_hub',
    enabled: true,
    priority: 95,
    city: 'Rio de Janeiro',
    notes:
      'Hub comercial da Riva no Rio de Janeiro.',
    followExternalLinks: true,
  },

  {
    id: 'ilha-pura',
    name: 'Ilha Pura',
    url: 'https://linktr.ee/ilhapura?utm_source=linktree_profile_share',
    kind: 'market',
    access: 'link_hub',
    enabled: true,
    priority: 95,
    city: 'Rio de Janeiro',
    notes:
      'Hub oficial/comercial Ilha Pura e seus empreendimentos.',
    followExternalLinks: true,
  },

  {
    id: 'drive-1bb-jhnr',
    name: 'Drive Comercial 1Bb_jhnr',
    url: 'https://drive.google.com/drive/u/0/mobile/folders/1Bb_jhnrPyN7bmW-DtUgBaoms1NpDer6q?usp=drive_link&sort=13&direction=a',
    kind: 'market',
    access: 'drive',
    enabled: true,
    priority: 85,
    notes:
      'Pasta Google Drive fornecida como fonte imobiliária.',
    followExternalLinks: true,
  },

  {
    id: 'w3-links-corretores',
    name: 'W3 Links Corretores',
    url: 'https://w3.com.br/a/links-corretores',
    kind: 'market',
    access: 'portal',
    enabled: true,
    priority: 90,
    notes:
      'Portal de links para corretores, usado como gateway para novas fontes.',
    followExternalLinks: true,
  },

  {
    id: 'tao-empreendimentos',
    name: 'TAO Empreendimentos',
    url: 'https://linktr.ee/TAOEmpreendimentos',
    kind: 'developer',
    access: 'link_hub',
    enabled: true,
    priority: 95,
    notes:
      'Hub TAO Empreendimentos.',
    followExternalLinks: true,
  },

  {
    id: 'drive-10hbrb76',
    name: 'Drive Comercial 10HBRb76',
    url: 'https://drive.google.com/drive/folders/10HBRb76yTFxL904Wc6YWnpEWYRKZ0RwW',
    kind: 'market',
    access: 'drive',
    enabled: true,
    priority: 85,
    notes:
      'Pasta Google Drive fornecida como fonte de materiais.',
    followExternalLinks: true,
  },

  {
    id: 'drive-10ct8-ae',
    name: 'Drive Comercial 10Ct8-ae',
    url: 'https://drive.google.com/drive/folders/10Ct8-aeEgDP6JmIiWi7KSMBmAFnA60nK',
    kind: 'market',
    access: 'drive',
    enabled: false,
    priority: 85,
    notes:
      'Fonte temporariamente desativada após retornar HTTP 404 em 2026-08-26. Manter o endereço para futura validação e reativação.',
    followExternalLinks: true,
  },

  {
    id: 'drive-11pvuz',
    name: 'Drive Comercial 11PVuz',
    url: 'https://drive.google.com/drive/folders/11PVuz_JLi7ayDSqP-aLX4e48EYZuJWUP',
    kind: 'market',
    access: 'drive',
    enabled: true,
    priority: 85,
    notes:
      'Pasta Google Drive fornecida como fonte de materiais.',
    followExternalLinks: true,
  },

  {
    id: 'drive-15s-mbsk',
    name: 'Drive Comercial 15S_mbSk',
    url: 'https://drive.google.com/drive/folders/15S_mbSkw8pjTPp4gbCdxS0YTK5C-NMG4?usp=drive_link',
    kind: 'market',
    access: 'drive',
    enabled: true,
    priority: 85,
    notes:
      'Pasta Google Drive fornecida como fonte de materiais.',
    followExternalLinks: true,
  },

  {
    id: 'showroom-botafogo',
    name: 'Showroom Botafogo',
    url: 'https://linktr.ee/showroom.botafogo?utm_source=linktree_profile_share',
    kind: 'market',
    access: 'link_hub',
    enabled: true,
    priority: 92,
    city: 'Rio de Janeiro',
    notes:
      'Hub comercial de showroom em Botafogo.',
    followExternalLinks: true,
  },

  {
    id: 'drive-1cegny7',
    name: 'Drive Comercial 1cegnY7',
    url: 'https://drive.google.com/drive/folders/1cegnY7AtxN9enAyHIWJdjZSvcAZwLQHS?usp=sharing',
    kind: 'market',
    access: 'drive',
    enabled: false,
    priority: 85,
    notes:
      'Fonte temporariamente desativada após retornar HTTP 404 em 2026-08-26. Manter o endereço para futura validação e reativação.',
    followExternalLinks: true,
  },

  {
    id: 'drive-1reexo1',
    name: 'Drive Comercial 1reExO1',
    url: 'https://drive.google.com/drive/folders/1reExO1trFYEouulaKMEozKne3W3SC2B2?usp=sharing',
    kind: 'market',
    access: 'drive',
    enabled: false,
    priority: 85,
    notes:
      'Fonte temporariamente desativada após retornar HTTP 404 em 2026-08-26. Manter o endereço para futura validação e reativação.',
    followExternalLinks: true,
  },

  {
    id: 'drive-1kgutqb',
    name: 'Drive Comercial 1KgUTQB',
    url: 'https://drive.google.com/drive/folders/1KgUTQBhAWsXg2gfbbmbDJtDUbyMuQEUF?usp=drive_link',
    kind: 'market',
    access: 'drive',
    enabled: true,
    priority: 85,
    notes:
      'Pasta Google Drive fornecida como fonte de materiais.',
    followExternalLinks: true,
  },

  {
    id: 'drive-11bemrq',
    name: 'Drive Comercial 11Bemrq',
    url: 'https://drive.google.com/drive/folders/11BemrqBYDM3XTAxImt8Sm6OJSkG3RMj-',
    kind: 'market',
    access: 'drive',
    enabled: true,
    priority: 85,
    notes:
      'Pasta Google Drive fornecida como fonte de materiais.',
    followExternalLinks: true,
  },

  {
    id: 'avanco-materiais',
    name: 'Avanço Materiais',
    url: 'https://linktr.ee/avanco_materiais',
    kind: 'market',
    access: 'link_hub',
    enabled: true,
    priority: 90,
    notes:
      'Hub de materiais comerciais Avanço.',
    followExternalLinks: true,
  },

  {
    id: 'canopus-construtora',
    name: 'Canopus Construtora',
    url: 'https://linktr.ee/canopusconstrutora',
    kind: 'developer',
    access: 'link_hub',
    enabled: true,
    priority: 95,
    notes:
      'Hub da Canopus Construtora. URL duplicada na lista original foi consolidada em uma única fonte.',
    followExternalLinks: true,
  },

  {
    id: 'arkt-incorporadora',
    name: 'ARKT Incorporadora',
    url: 'https://linktr.ee/ARKTINCORPORADORA',
    kind: 'developer',
    access: 'link_hub',
    enabled: true,
    priority: 95,
    notes:
      'Hub da ARKT Incorporadora.',
    followExternalLinks: true,
  },

  {
    id: 'comercial-balassiano',
    name: 'Comercial Balassiano',
    url: 'https://linktr.ee/ComercialBalassiano',
    kind: 'market',
    access: 'link_hub',
    enabled: true,
    priority: 92,
    notes:
      'Hub comercial Balassiano.',
    followExternalLinks: true,
  },

  {
    id: 'piimo',
    name: 'PIIMO',
    url: 'https://linktr.ee/piimo.com.br',
    kind: 'market',
    access: 'link_hub',
    enabled: true,
    priority: 90,
    notes:
      'Hub PIIMO fornecido como fonte imobiliária.',
    followExternalLinks: true,
  },

  {
    id: 'comercial-calper',
    name: 'Comercial Calper',
    url: 'https://linktr.ee/comercialcalper',
    kind: 'developer',
    access: 'link_hub',
    enabled: true,
    priority: 100,
    city: 'Rio de Janeiro',
    notes:
      'Hub comercial da Calper. Fonte obrigatória para descoberta de empreendimentos e materiais.',
    followExternalLinks: true,
  },
];

export function getEnabledSourceRoots() {
  return sourceRoots
    .filter(
      (source) =>
        source.enabled,
    )
    .sort(
      (a, b) =>
        b.priority -
        a.priority,
    );
}

export function getDeveloperSourceRoots() {
  return getEnabledSourceRoots().filter(
    (source) =>
      source.kind ===
      'developer',
  );
}

export function getGatewaySourceRoots() {
  return getEnabledSourceRoots().filter(
    (source) =>
      source.followExternalLinks ===
      true,
  );
}

export function getSourceRootById(
  id: string,
) {
  return sourceRoots.find(
    (source) =>
      source.id === id,
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

          if (
            sourceHost !==
            targetHost
          ) {
            return false;
          }

          if (
            source.access ===
              'link_hub' ||
            source.access ===
              'drive'
          ) {
            return (
              normalizeComparableUrl(
                source.url,
              ) ===
              normalizeComparableUrl(
                value,
              )
            );
          }

          return true;
        } catch {
          return false;
        }
      },
    );
  } catch {
    return undefined;
  }
}

function normalizeComparableUrl(
  value: string,
) {
  const url =
    new URL(value);

  url.hash = '';

  for (
    const key of [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'usp',
      'sort',
      'direction',
    ]
  ) {
    url.searchParams.delete(
      key,
    );
  }

  if (
    url.pathname.length >
      1 &&
    url.pathname.endsWith(
      '/',
    )
  ) {
    url.pathname =
      url.pathname.slice(
        0,
        -1,
      );
  }

  return url.toString();
}
