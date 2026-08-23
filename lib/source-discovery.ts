import 'server-only';

export type DiscoveredSource = {
  url: string;
  title: string | null;
  kind:
    | 'project'
    | 'neighborhood'
    | 'developer'
    | 'article'
    | 'document'
    | 'other';
  score: number;
};

type DiscoverOptions = {
  maxPages?: number;
  maxDepth?: number;
};

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
];

const HARD_EXCLUDED_PATHS = [
  '/contato',
  '/contact',
  '/fale-conosco',
  '/politica-de-privacidade',
  '/politica-privacidade',
  '/privacy',
  '/privacy-policy',
  '/termos',
  '/terms',
  '/termos-de-uso',
  '/cookies',
  '/login',
  '/minha-conta',
  '/wp-admin',
];

const SOFT_EXCLUDED_TERMS = [
  'contato',
  'fale conosco',
  'politica de privacidade',
  'privacy policy',
  'termos de uso',
  'assessoria de imprensa',
  'trabalhe conosco',
  'carreiras',
  'lgpd',
  'qualidade',
  'compliance',
  'governanca',
  'fornecedores',
  'codigo de conduta',
  'relatorio institucional',
];

const ARTICLE_TERMS = [
  'blog',
  'noticia',
  'noticias',
  'artigo',
  'artigos',
  'conteudo',
  'mercado',
  'tendencia',
  'tendencias',
  'decoracao',
  'arquitetura',
  'investimento',
  'investir',
  'lifestyle',
  'dicas',
  'guia',
];

const STRONG_PROJECT_TERMS = [
  'lancamento',
  'residencial',
  'residence',
  'residences',
  'condominio',
  'empreendimento',
  'projeto',
  'produto',
  'apartamentos novos',
  'casas novas',
  'studios',
  'studio',
];

const WEAK_PROJECT_TERMS = [
  'imovel',
  'imoveis',
  'apartamento',
  'apartamentos',
  'casa',
  'casas',
];

const PROJECT_PATH_MARKERS = [
  '/produto/',
  '/produtos/',
  '/projeto/',
  '/projetos/',
  '/empreendimento/',
  '/empreendimentos/',
  '/lancamento/',
  '/lancamentos/',
  '/residencial/',
  '/residence/',
  '/residences/',
];

const PROJECT_LISTING_PATHS = [
  '/projetos',
  '/empreendimentos',
  '/lancamentos',
  '/imoveis',
  '/busca',
  '/disponiveis',
  '/em-andamento',
  '/concluidos',
  '/produtos',
];

const COLLECTION_TERMS = [
  'colecao',
  'collection',
];

const NEIGHBORHOOD_TERMS = [
  'bairro',
  'bairros',
  'ipanema',
  'leblon',
  'copacabana',
  'arpoador',
  'barra da tijuca',
  'barra-da-tijuca',
  'flamengo',
  'laranjeiras',
  'jardim botanico',
  'jardim-botanico',
  'jardim oceanico',
  'jardim-oceanico',
  'sao conrado',
  'sao-conrado',
  'gavea',
  'lagoa',
  'joa',
  'recreio',
  'peninsula',
  'abm',
  'botafogo',
  'gloria',
  'brooklin',
  'perdizes',
  'cidade jardim',
  'cidade-jardim',
  'chacara klabin',
  'chacara-klabin',
  'higienopolis',
  'cambui',
  'sacoma',
];

const DEVELOPER_TERMS = [
  'incorporadora',
  'incorporador',
  'construtora',
  'developer',
  'institucional',
  'quem somos',
  'sobre nos',
  'sobre a empresa',
];

const GENERIC_PROJECT_TITLES = [
  'lancamentos e imoveis prontos',
  'empreendimentos de alto padrao',
  'encontre seu imovel',
  'encontre seu apartamento',
  'apartamentos a venda',
  'imoveis a venda',
  'home',
  'inicio',
];

const COMMERCIAL_DOCUMENT_TERMS = [
  'book',
  'book-digital',
  'apresentacao',
  'material',
  'folder',
  'brochura',
  'catalogo',
  'planta',
  'plantas',
  'implantacao',
  'memorial',
  'decorado',
  'tabela',
  'disponibilidade',
  'tipologia',
  'tipologias',
  'unidades',
  'lancamento',
  'empreendimento',
  'residencial',
  'residence',
];

const INSTITUTIONAL_DOCUMENT_TERMS = [
  'qualidade',
  'politica',
  'politicas',
  'codigo',
  'conduta',
  'compliance',
  'governanca',
  'lgpd',
  'privacidade',
  'sustentabilidade',
  'relatorio',
  'manual fornecedor',
  'fornecedores',
  'certificacao',
];

function normalizeText(
  value: string,
) {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLocaleLowerCase(
      'pt-BR',
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(
  value: string,
  base?: string,
) {
  try {
    const url = base
      ? new URL(
          value,
          base,
        )
      : new URL(value);

    if (
      ![
        'http:',
        'https:',
      ].includes(
        url.protocol,
      )
    ) {
      return null;
    }

    url.hash = '';

    for (
      const key of
      TRACKING_PARAMS
    ) {
      url.searchParams.delete(
        key,
      );
    }

    if (
      url.hostname.startsWith(
        'www.',
      )
    ) {
      url.hostname =
        url.hostname.slice(4);
    }

    if (
      url.pathname.length > 1 &&
      url.pathname.endsWith('/')
    ) {
      url.pathname =
        url.pathname.slice(
          0,
          -1,
        );
    }

    const sortedParams = [
      ...url.searchParams.entries(),
    ].sort(
      ([a], [b]) =>
        a.localeCompare(b),
    );

    url.search = '';

    for (
      const [
        key,
        paramValue,
      ] of sortedParams
    ) {
      url.searchParams.append(
        key,
        paramValue,
      );
    }

    return url.toString();
  } catch {
    return null;
  }
}

function sameHost(
  root: URL,
  candidate: string,
) {
  try {
    const url =
      new URL(candidate);

    const rootHost =
      root.hostname.replace(
        /^www\./,
        '',
      );

    const candidateHost =
      url.hostname.replace(
        /^www\./,
        '',
      );

    return (
      rootHost ===
      candidateHost
    );
  } catch {
    return false;
  }
}

function isHardExcluded(
  url: string,
) {
  try {
    const parsed =
      new URL(url);

    const path =
      parsed.pathname
        .toLocaleLowerCase(
          'pt-BR',
        );

    return HARD_EXCLUDED_PATHS.some(
      (item) =>
        path === item ||
        path.startsWith(
          `${item}/`,
        ),
    );
  } catch {
    return true;
  }
}

function isStaticAsset(
  url: string,
) {
  try {
    const pathname =
      new URL(url)
        .pathname
        .toLowerCase();

    return /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf|mp4|webm|mov|zip|rar|7z)$/i.test(
      pathname,
    );
  } catch {
    return true;
  }
}

function isDocumentUrl(
  url: string,
) {
  try {
    return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(
      new URL(url).pathname,
    );
  } catch {
    return false;
  }
}

function stripHtml(
  value: string,
) {
  return value
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      ' ',
    )
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      ' ',
    )
    .replace(
      /<noscript[\s\S]*?<\/noscript>/gi,
      ' ',
    )
    .replace(
      /<[^>]+>/g,
      ' ',
    )
    .replace(
      /&nbsp;/gi,
      ' ',
    )
    .replace(
      /&amp;/gi,
      '&',
    )
    .replace(
      /&quot;/gi,
      '"',
    )
    .replace(
      /&#39;/gi,
      "'",
    )
    .replace(
      /&#8211;/gi,
      '–',
    )
    .replace(
      /&#8212;/gi,
      '—',
    )
    .replace(
      /&#183;/gi,
      '·',
    )
    .replace(
      /\s+/g,
      ' ',
    )
    .trim();
}

function extractTitle(
  html: string,
) {
  const match =
    html.match(
      /<title[^>]*>([\s\S]*?)<\/title>/i,
    );

  if (!match?.[1]) {
    return null;
  }

  const title =
    stripHtml(
      match[1],
    );

  return title || null;
}

function extractLinks(
  html: string,
  baseUrl: string,
) {
  const links:
    string[] = [];

  const regex =
    /<a\s[^>]*href=["']([^"']+)["'][^>]*>/gi;

  let match:
    RegExpExecArray | null;

  while (
    (match =
      regex.exec(html))
  ) {
    const normalized =
      normalizeUrl(
        match[1],
        baseUrl,
      );

    if (normalized) {
      links.push(
        normalized,
      );
    }
  }

  return [
    ...new Set(links),
  ];
}

function pathDepth(
  url: string,
) {
  return new URL(url)
    .pathname
    .split('/')
    .filter(Boolean)
    .length;
}

function getPathSegments(
  url: string,
) {
  return new URL(url)
    .pathname
    .split('/')
    .filter(Boolean)
    .map(
      (segment) =>
        normalizeText(
          decodeURIComponent(
            segment,
          ),
        ),
    );
}

function isLikelyListingPage(
  url: string,
) {
  const parsed =
    new URL(url);

  const path =
    parsed.pathname
      .toLowerCase();

  const segments =
    path
      .split('/')
      .filter(Boolean);

  if (
    PROJECT_LISTING_PATHS.some(
      (term) =>
        path === term,
    )
  ) {
    return true;
  }

  if (
    path.includes(
      '/page/',
    )
  ) {
    return true;
  }

  if (
    segments.length <= 2 &&
    PROJECT_LISTING_PATHS.some(
      (term) =>
        path.includes(
          `${term}/`,
        ),
    )
  ) {
    return true;
  }

  return false;
}

function hasStrongProjectPath(
  url: string,
) {
  const pathname =
    new URL(url)
      .pathname
      .toLowerCase();

  return PROJECT_PATH_MARKERS.some(
    (marker) =>
      pathname.includes(
        marker,
      ),
  );
}

function looksLikeSpecificSlug(
  url: string,
) {
  const segments =
    getPathSegments(url);

  if (
    segments.length === 0
  ) {
    return false;
  }

  const last =
    segments[
      segments.length - 1
    ];

  if (
    !last ||
    last.length < 4
  ) {
    return false;
  }

  const genericSegments =
    new Set([
      'projetos',
      'empreendimentos',
      'produtos',
      'produto',
      'lancamentos',
      'lancamento',
      'imoveis',
      'disponiveis',
      'bairro',
      'bairros',
      'blog',
      'sobre',
    ]);

  return !genericSegments.has(
    last,
  );
}

function classifyDocument(
  url: string,
): Pick<
  DiscoveredSource,
  'kind' | 'score'
> {
  const parsed =
    new URL(url);

  const text =
    normalizeText(
      decodeURIComponent(
        parsed.pathname,
      ),
    );

  let score = 35;

  const commercialSignals =
    COMMERCIAL_DOCUMENT_TERMS.filter(
      (term) =>
        text.includes(
          normalizeText(
            term,
          ),
        ),
    ).length;

  const institutionalSignals =
    INSTITUTIONAL_DOCUMENT_TERMS.filter(
      (term) =>
        text.includes(
          normalizeText(
            term,
          ),
        ),
    ).length;

  score +=
    commercialSignals * 15;

  score -=
    institutionalSignals * 20;

  if (
    text.includes('book')
  ) {
    score += 15;
  }

  if (
    text.includes('planta') ||
    text.includes(
      'implantacao',
    )
  ) {
    score += 15;
  }

  if (
    institutionalSignals > 0 &&
    commercialSignals === 0
  ) {
    score = Math.min(
      score,
      25,
    );
  }

  return {
    kind: 'document',
    score:
      Math.max(
        10,
        Math.min(
          score,
          95,
        ),
      ),
  };
}

function classifyUrl(
  url: string,
  title: string | null,
): Pick<
  DiscoveredSource,
  'kind' | 'score'
> {
  if (
    isDocumentUrl(url)
  ) {
    return classifyDocument(
      url,
    );
  }

  const parsed =
    new URL(url);

  const titleText =
    normalizeText(
      title ?? '',
    );

  const pathText =
    normalizeText(
      decodeURIComponent(
        parsed.pathname,
      ),
    );

  const fullText =
    `${pathText} ${titleText}`;

  if (
    SOFT_EXCLUDED_TERMS.some(
      (term) =>
        fullText.includes(
          normalizeText(
            term,
          ),
        ),
    )
  ) {
    return {
      kind: 'other',
      score: 5,
    };
  }

  const isArticle =
    ARTICLE_TERMS.some(
      (term) =>
        fullText.includes(
          normalizeText(
            term,
          ),
        ),
    ) ||
    parsed.pathname.includes(
      '/blog/',
    );

  if (isArticle) {
    let articleScore = 50;

    if (
      parsed.pathname.includes(
        '/blog/',
      )
    ) {
      articleScore += 20;
    }

    if (
      title &&
      title.length >= 25
    ) {
      articleScore += 10;
    }

    return {
      kind: 'article',
      score:
        Math.min(
          articleScore,
          90,
        ),
    };
  }

  const listingPage =
    isLikelyListingPage(
      url,
    );

  const collectionPage =
    COLLECTION_TERMS.some(
      (term) =>
        fullText.includes(
          term,
        ),
    );

  const strongProjectSignals =
    STRONG_PROJECT_TERMS.filter(
      (term) =>
        fullText.includes(
          normalizeText(
            term,
          ),
        ),
    ).length;

  const weakProjectSignals =
    WEAK_PROJECT_TERMS.filter(
      (term) =>
        fullText.includes(
          normalizeText(
            term,
          ),
        ),
    ).length;

  const neighborhoodSignals =
    NEIGHBORHOOD_TERMS.filter(
      (term) =>
        fullText.includes(
          normalizeText(
            term,
          ),
        ),
    ).length;

  const developerSignals =
    DEVELOPER_TERMS.filter(
      (term) =>
        fullText.includes(
          normalizeText(
            term,
          ),
        ),
    ).length;

  const depth =
    pathDepth(url);

  const specificSlug =
    looksLikeSpecificSlug(
      url,
    );

  const strongPath =
    hasStrongProjectPath(
      url,
    );

  const genericTitle =
    GENERIC_PROJECT_TITLES.some(
      (term) =>
        titleText.includes(
          term,
        ),
    );

  if (collectionPage) {
    return {
      kind: 'neighborhood',
      score:
        neighborhoodSignals >
        0
          ? 55
          : 40,
    };
  }

  if (listingPage) {
    if (
      neighborhoodSignals >
      0
    ) {
      return {
        kind:
          'neighborhood',
        score: 45,
      };
    }

    return {
      kind:
        developerSignals >
        0
          ? 'developer'
          : 'other',
      score:
        developerSignals >
        0
          ? 35
          : 20,
    };
  }

  let projectScore = 0;

  if (
    strongProjectSignals >
    0
  ) {
    projectScore +=
      35 +
      Math.min(
        strongProjectSignals *
          10,
        30,
      );
  }

  if (
    strongPath
  ) {
    projectScore += 15;
  }

  if (
    specificSlug
  ) {
    projectScore += 10;
  }

  if (
    depth >= 3
  ) {
    projectScore += 10;
  }

  if (
    depth >= 5
  ) {
    projectScore += 5;
  }

  if (
    weakProjectSignals >
      0 &&
    strongProjectSignals ===
      0
  ) {
    projectScore += 10;
  }

  if (
    genericTitle
  ) {
    projectScore -= 30;
  }

  if (
    projectScore >= 50
  ) {
    return {
      kind: 'project',
      score:
        Math.max(
          0,
          Math.min(
            projectScore,
            100,
          ),
        ),
    };
  }

  if (
    neighborhoodSignals >
    0
  ) {
    let neighborhoodScore =
      30;

    if (
      titleText.includes(
        'bairro',
      )
    ) {
      neighborhoodScore +=
        15;
    }

    if (
      depth <= 3
    ) {
      neighborhoodScore +=
        5;
    }

    return {
      kind:
        'neighborhood',
      score:
        Math.min(
          neighborhoodScore,
          75,
        ),
    };
  }

  if (
    developerSignals >
    0
  ) {
    return {
      kind: 'developer',
      score:
        Math.min(
          35 +
            developerSignals *
              10,
          75,
        ),
    };
  }

  if (
    weakProjectSignals >
    0
  ) {
    return {
      kind: 'other',
      score: 20,
    };
  }

  return {
    kind: 'other',
    score: 10,
  };
}

async function fetchHtml(
  url: string,
) {
  const response =
    await fetch(
      url,
      {
        cache:
          'no-store',

        redirect:
          'follow',

        headers: {
          Accept:
            'text/html,application/xhtml+xml',

          'User-Agent':
            'Mozilla/5.0 (compatible; ProjetoAlphaBot/1.0; +https://imoveisdealtopadraorio.com.br)',
        },
      },
    );

  if (!response.ok) {
    return null;
  }

  const contentType =
    response.headers.get(
      'content-type',
    ) ?? '';

  if (
    !contentType
      .toLowerCase()
      .includes(
        'text/html',
      )
  ) {
    return null;
  }

  return response.text();
}

export async function discoverSources(
  rootUrl: string,
  options: DiscoverOptions = {},
): Promise<
  DiscoveredSource[]
> {
  const normalizedRoot =
    normalizeUrl(
      rootUrl,
    );

  if (!normalizedRoot) {
    throw new Error(
      'URL raiz inválida.',
    );
  }

  const root =
    new URL(
      normalizedRoot,
    );

  const maxPages =
    Math.max(
      1,
      Math.min(
        options.maxPages ??
          40,
        100,
      ),
    );

  const maxDepth =
    Math.max(
      0,
      Math.min(
        options.maxDepth ??
          2,
        4,
      ),
    );

  const queue: Array<{
    url: string;
    depth: number;
  }> = [
    {
      url:
        normalizedRoot,
      depth: 0,
    },
  ];

  const visited =
    new Set<string>();

  const queued =
    new Set<string>([
      normalizedRoot,
    ]);

  const discovered =
    new Map<
      string,
      DiscoveredSource
    >();

  while (
    queue.length > 0 &&
    visited.size <
      maxPages
  ) {
    const current =
      queue.shift();

    if (!current) {
      break;
    }

    if (
      visited.has(
        current.url,
      )
    ) {
      continue;
    }

    if (
      isHardExcluded(
        current.url,
      )
    ) {
      continue;
    }

    visited.add(
      current.url,
    );

    if (
      isDocumentUrl(
        current.url,
      )
    ) {
      const classification =
        classifyDocument(
          current.url,
        );

      if (
        classification.score >=
        20
      ) {
        discovered.set(
          current.url,
          {
            url:
              current.url,

            title:
              null,

            kind:
              classification.kind,

            score:
              classification.score,
          },
        );
      }

      continue;
    }

    const html =
      await fetchHtml(
        current.url,
      );

    if (!html) {
      continue;
    }

    const title =
      extractTitle(html);

    const classification =
      classifyUrl(
        current.url,
        title,
      );

    if (
      classification.score >=
      20
    ) {
      discovered.set(
        current.url,
        {
          url:
            current.url,

          title,

          kind:
            classification.kind,

          score:
            classification.score,
        },
      );
    }

    if (
      current.depth >=
      maxDepth
    ) {
      continue;
    }

    const links =
      extractLinks(
        html,
        current.url,
      );

    for (
      const link of links
    ) {
      if (
        !sameHost(
          root,
          link,
        )
      ) {
        continue;
      }

      if (
        isStaticAsset(
          link,
        ) ||
        isHardExcluded(
          link,
        )
      ) {
        continue;
      }

      if (
        isDocumentUrl(
          link,
        )
      ) {
        if (
          !discovered.has(
            link,
          )
        ) {
          const classification =
            classifyDocument(
              link,
            );

          if (
            classification.score >=
            20
          ) {
            discovered.set(
              link,
              {
                url:
                  link,

                title:
                  null,

                kind:
                  classification.kind,

                score:
                  classification.score,
              },
            );
          }
        }

        continue;
      }

      if (
        visited.has(
          link,
        ) ||
        queued.has(
          link,
        )
      ) {
        continue;
      }

      queued.add(link);

      queue.push({
        url: link,

        depth:
          current.depth +
          1,
      });
    }
  }

  return [
    ...discovered.values(),
  ]
    .filter(
      (item) =>
        item.score >=
        20,
    )
    .sort(
      (a, b) =>
        b.score -
        a.score,
    );
}
