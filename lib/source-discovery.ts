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
];

const PROJECT_TERMS = [
  'empreendimento',
  'empreendimentos',
  'lancamento',
  'lancamentos',
  'residencial',
  'residence',
  'project',
  'projects',
  'produto',
  'imovel',
  'imoveis',
  'apartamento',
  'apartamentos',
  'casas',
];

const PROJECT_LISTING_TERMS = [
  '/projetos',
  '/empreendimentos',
  '/lancamentos',
  '/imoveis',
  '/busca',
  '/disponiveis',
  '/em-andamento',
  '/concluidos',
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
      ? new URL(value, base)
      : new URL(value);

    if (
      !['http:', 'https:'].includes(
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
      url.searchParams.delete(key);
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
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#8211;/gi, '–')
    .replace(/&#8212;/gi, '—')
    .replace(/&#183;/gi, '·')
    .replace(/\s+/g, ' ')
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
    stripHtml(match[1]);

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

function isLikelyListingPage(
  url: string,
) {
  const parsed =
    new URL(url);

  const path =
    normalizeText(
      parsed.pathname,
    );

  const segments =
    parsed.pathname
      .split('/')
      .filter(Boolean);

  const exactListing =
    PROJECT_LISTING_TERMS.some(
      (term) =>
        path === term.replace(
          /^\//,
          '',
        ) ||
        parsed.pathname === term,
    );

  if (exactListing) {
    return true;
  }

  if (
    parsed.pathname.includes(
      '/page/',
    )
  ) {
    return true;
  }

  if (
    segments.length <= 2 &&
    PROJECT_LISTING_TERMS.some(
      (term) =>
        parsed.pathname.includes(
          term,
        ),
    )
  ) {
    return true;
  }

  return false;
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
    return {
      kind: 'document',
      score: 95,
    };
  }

  const parsed =
    new URL(url);

  const titleText =
    normalizeText(
      title ?? '',
    );

  const pathText =
    normalizeText(
      parsed.pathname,
    );

  const fullText =
    `${pathText} ${titleText}`;

  if (
    SOFT_EXCLUDED_TERMS.some(
      (term) =>
        fullText.includes(
          normalizeText(term),
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
          term,
        ),
    ) ||
    parsed.pathname.includes(
      '/blog/',
    );

  if (isArticle) {
    let articleScore = 55;

    if (
      parsed.pathname.includes(
        '/blog/'
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
      score: Math.min(
        articleScore,
        95,
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

  const hasProjectTerm =
    PROJECT_TERMS.some(
      (term) =>
        fullText.includes(
          term,
        ),
    );

  const hasNeighborhoodTerm =
    NEIGHBORHOOD_TERMS.some(
      (term) =>
        fullText.includes(
          term,
        ),
    );

  const depth =
    pathDepth(url);

  let kind:
    DiscoveredSource['kind'] =
      'other';

  let score = 0;

  if (
    hasProjectTerm &&
    !listingPage &&
    !collectionPage
  ) {
    kind = 'project';
    score += 45;
  }

  if (
    hasNeighborhoodTerm
  ) {
    if (
      kind === 'other'
    ) {
      kind =
        'neighborhood';
    }

    score += 25;
  }

  if (
    collectionPage
  ) {
    kind =
      'neighborhood';

    score = Math.max(
      score,
      45,
    );
  }

  if (
    listingPage
  ) {
    if (
      hasNeighborhoodTerm
    ) {
      kind =
        'neighborhood';

      score = Math.max(
        score,
        40,
      );
    } else {
      kind =
        'developer';

      score = Math.max(
        score,
        30,
      );
    }
  }

  if (
    [
      'incorporadora',
      'construtora',
      'developer',
      'institucional',
    ].some(
      (term) =>
        fullText.includes(
          term,
        ),
    )
  ) {
    if (
      kind === 'other'
    ) {
      kind =
        'developer';
    }

    score += 20;
  }

  if (
    depth >= 2
  ) {
    score += 10;
  }

  if (
    depth >= 4 &&
    kind === 'project'
  ) {
    score += 10;
  }

  if (
    title &&
    title.length >= 15
  ) {
    score += 5;
  }

  if (
    kind === 'project' &&
    title
  ) {
    const genericTitle =
      [
        'lancamentos e imoveis prontos',
        'empreendimentos de alto padrao',
        'encontre seu',
        'home',
      ].some(
        (term) =>
          titleText.includes(
            term,
          ),
      );

    if (genericTitle) {
      score -= 25;
    }
  }

  return {
    kind,
    score:
      Math.max(
        0,
        Math.min(
          score,
          100,
        ),
      ),
  };
}

async function fetchHtml(
  url: string,
) {
  const response =
    await fetch(url, {
      cache: 'no-store',

      redirect: 'follow',

      headers: {
        Accept:
          'text/html,application/xhtml+xml',

        'User-Agent':
          'Mozilla/5.0 (compatible; ProjetoAlphaBot/1.0; +https://imoveisdealtopadraorio.com.br)',
      },
    });

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
      .includes('text/html')
  ) {
    return null;
  }

  return response.text();
}

export async function discoverSources(
  rootUrl: string,
  options: DiscoverOptions = {},
): Promise<DiscoveredSource[]> {
  const normalizedRoot =
    normalizeUrl(rootUrl);

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
    visited.size < maxPages
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
      discovered.set(
        current.url,
        {
          url:
            current.url,
          title: null,
          kind:
            'document',
          score: 95,
        },
      );

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
        isStaticAsset(link) ||
        isHardExcluded(link)
      ) {
        continue;
      }

      if (
        isDocumentUrl(link)
      ) {
        if (
          !discovered.has(
            link,
          )
        ) {
          discovered.set(
            link,
            {
              url: link,
              title: null,
              kind:
                'document',
              score: 95,
            },
          );
        }

        continue;
      }

      if (
        visited.has(link) ||
        queued.has(link)
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
        item.score >= 20,
    )
    .sort(
      (a, b) =>
        b.score -
        a.score,
    );
}
