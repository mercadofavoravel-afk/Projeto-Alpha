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

const STRONG_NEGATIVE_TERMS = [
  'trabalhe conosco',
  'trabalhe-conosco',
  'carreiras',
  'vaga',
  'vagas',
  'lgpd',
  'privacidade',
  'politica de privacidade',
  'politica-de-privacidade',
  'compliance',
  'governanca',
  'codigo de conduta',
  'qualidade',
  'fornecedores',
  'assessoria de imprensa',
  'imprensa',
  'venda seu terreno',
  'venda-seu-terreno',
];

const ARTICLE_TERMS = [
  'blog',
  'noticia',
  'noticias',
  'artigo',
  'artigos',
  'decoracao',
  'arquitetura',
  'lifestyle',
  'mercado imobiliario',
  'tendencia',
  'tendencias',
  'dicas',
  'guia',
];

const COMMERCIAL_DOCUMENT_TERMS = [
  'book',
  'book digital',
  'book-digital',
  'apresentacao',
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
  'certificacao',
  'fornecedor',
  'fornecedores',
];

const PROJECT_WORDS = [
  'residencial',
  'residence',
  'residences',
  'residencial',
  'condominio',
  'condominium',
  'lancamento',
  'empreendimento',
  'studios',
  'studio',
  'home',
  'homes',
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

const GENERIC_LISTING_SEGMENTS = new Set([
  'projetos',
  'empreendimentos',
  'produtos',
  'lancamentos',
  'imoveis',
  'disponiveis',
  'busca',
  'todos',
  'todos-os-imoveis',
]);

const GENERIC_LAST_SEGMENTS = new Set([
  'home',
  'inicio',
  'sobre',
  'blog',
  'projetos',
  'produto',
  'produtos',
  'empreendimentos',
  'lancamentos',
  'imoveis',
  'disponiveis',
  'bairros',
]);

const NEIGHBORHOOD_NAMES = [
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
  'quem somos',
  'sobre nos',
  'sobre a empresa',
  'institucional',
];

const GATEWAY_HOSTS = [
  'linktr.ee',
  'drive.google.com',
  'docs.google.com',
  'youtube.com',
  'youtu.be',
  'instagram.com',
  'facebook.com',
  'pinterest.com',
  'matterport.com',
  'my.matterport.com',
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

    url.hostname =
      url.hostname.replace(
        /^www\./,
        '',
      );

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
    const candidateUrl =
      new URL(candidate);

    return (
      root.hostname.replace(
        /^www\./,
        '',
      ) ===
      candidateUrl.hostname.replace(
        /^www\./,
        '',
      )
    );
  } catch {
    return false;
  }
}

function isGatewayHost(
  url: string,
) {
  try {
    const hostname =
      new URL(url)
        .hostname
        .replace(
          /^www\./,
          '',
        )
        .toLowerCase();

    return GATEWAY_HOSTS.some(
      (host) =>
        hostname === host ||
        hostname.endsWith(
          `.${host}`,
        ),
    );
  } catch {
    return false;
  }
}

function isHardExcluded(
  url: string,
) {
  try {
    const path =
      new URL(url)
        .pathname
        .toLowerCase();

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

function pathDepth(
  url: string,
) {
  return getPathSegments(
    url,
  ).length;
}

function getLastSegment(
  url: string,
) {
  const segments =
    getPathSegments(url);

  return (
    segments[
      segments.length - 1
    ] ?? ''
  );
}

function containsAny(
  text: string,
  terms: string[],
) {
  return terms.some(
    (term) =>
      text.includes(
        normalizeText(
          term,
        ),
      ),
  );
}

function countTerms(
  text: string,
  terms: string[],
) {
  return terms.filter(
    (term) =>
      text.includes(
        normalizeText(
          term,
        ),
      ),
  ).length;
}

function isNeighborhoodSegment(
  segment: string,
) {
  return NEIGHBORHOOD_NAMES.some(
    (term) =>
      segment ===
      normalizeText(term),
  );
}

function isGenericListingPage(
  url: string,
) {
  const segments =
    getPathSegments(url);

  if (
    segments.length === 0
  ) {
    return true;
  }

  const last =
    segments[
      segments.length - 1
    ];

  if (
    GENERIC_LISTING_SEGMENTS.has(
      last,
    )
  ) {
    return true;
  }

  if (
    segments.length <= 2 &&
    segments.some(
      (segment) =>
        GENERIC_LISTING_SEGMENTS.has(
          segment,
        ),
    )
  ) {
    return true;
  }

  return false;
}

function hasProjectPathMarker(
  url: string,
) {
  const path =
    new URL(url)
      .pathname
      .toLowerCase();

  return PROJECT_PATH_MARKERS.some(
    (marker) =>
      path.includes(
        marker,
      ),
  );
}

function looksLikeSpecificProjectPath(
  url: string,
) {
  const segments =
    getPathSegments(url);

  if (
    segments.length < 2
  ) {
    return false;
  }

  const last =
    getLastSegment(url);

  if (
    !last ||
    last.length < 4
  ) {
    return false;
  }

  if (
    GENERIC_LAST_SEGMENTS.has(
      last,
    )
  ) {
    return false;
  }

  /*
   * Fundamental para casos Tegra:
   *
   * /sp/sao-paulo/sul/brooklin/amperebrooklin
   *
   * Brooklin é bairro, mas o último segmento
   * é um produto específico.
   */
  if (
    segments.length >= 4 &&
    !isNeighborhoodSegment(
      last,
    )
  ) {
    return true;
  }

  if (
    hasProjectPathMarker(
      url,
    ) &&
    !isNeighborhoodSegment(
      last,
    )
  ) {
    return true;
  }

  return false;
}

function isNeighborhoodLandingPage(
  url: string,
  titleText: string,
) {
  const segments =
    getPathSegments(url);

  const last =
    getLastSegment(url);

  if (
    !isNeighborhoodSegment(
      last,
    )
  ) {
    return false;
  }

  if (
    looksLikeSpecificProjectPath(
      url,
    )
  ) {
    return false;
  }

  if (
    titleText.includes(
      'bairro',
    )
  ) {
    return true;
  }

  return (
    segments.length <= 5
  );
}

function classifyDocument(
  url: string,
): Pick<
  DiscoveredSource,
  'kind' | 'score'
> {
  const text =
    normalizeText(
      decodeURIComponent(
        new URL(url)
          .pathname,
      ),
    );

  const commercial =
    countTerms(
      text,
      COMMERCIAL_DOCUMENT_TERMS,
    );

  const institutional =
    countTerms(
      text,
      INSTITUTIONAL_DOCUMENT_TERMS,
    );

  let score = 25;

  score +=
    commercial * 15;

  score -=
    institutional * 20;

  if (
    text.includes(
      'book',
    )
  ) {
    score += 20;
  }

  if (
    text.includes(
      'planta',
    ) ||
    text.includes(
      'implantacao',
    )
  ) {
    score += 20;
  }

  if (
    institutional > 0 &&
    commercial === 0
  ) {
    score = 10;
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

  const pathText =
    normalizeText(
      decodeURIComponent(
        parsed.pathname,
      ),
    );

  const titleText =
    normalizeText(
      title ?? '',
    );

  const fullText =
    `${pathText} ${titleText}`;

  /*
   * Gateways são portas de entrada.
   * Não são empreendimentos por si só.
   */
  if (
    isGatewayHost(url)
  ) {
    if (
      containsAny(
        fullText,
        ARTICLE_TERMS,
      )
    ) {
      return {
        kind: 'article',
        score: 25,
      };
    }

    return {
      kind: 'other',
      score: 20,
    };
  }

  if (
    containsAny(
      fullText,
      STRONG_NEGATIVE_TERMS,
    )
  ) {
    return {
      kind: 'other',
      score: 5,
    };
  }

  const isArticle =
    parsed.pathname.includes(
      '/blog/',
    ) ||
    containsAny(
      fullText,
      ARTICLE_TERMS,
    );

  if (isArticle) {
    let score = 55;

    if (
      parsed.pathname.includes(
        '/blog/',
      )
    ) {
      score += 15;
    }

    if (
      title &&
      title.length >= 25
    ) {
      score += 10;
    }

    return {
      kind: 'article',
      score:
        Math.min(
          score,
          85,
        ),
    };
  }

  const depth =
    pathDepth(url);

  const specificProject =
    looksLikeSpecificProjectPath(
      url,
    );

  const neighborhoodLanding =
    isNeighborhoodLandingPage(
      url,
      titleText,
    );

  /*
   * PRECEDÊNCIA MAIS IMPORTANTE:
   *
   * Produto específico vem ANTES de bairro.
   *
   * Isso corrige:
   * brooklin/amperebrooklin
   * brooklin/ledgebrooklin
   * higienopolis/aria-higienopolis
   * cambui/andradecoutinho
   */
  if (specificProject) {
    let score = 65;

    if (
      hasProjectPathMarker(
        url,
      )
    ) {
      score += 15;
    }

    if (
      containsAny(
        fullText,
        PROJECT_WORDS,
      )
    ) {
      score += 10;
    }

    if (
      depth >= 5
    ) {
      score += 10;
    }

    return {
      kind: 'project',
      score:
        Math.min(
          score,
          100,
        ),
    };
  }

  /*
   * Só depois de excluir projeto específico
   * consideramos que a URL é página territorial.
   */
  if (
    neighborhoodLanding
  ) {
    return {
      kind:
        'neighborhood',
      score:
        titleText.includes(
          'bairro',
        )
          ? 55
          : 45,
    };
  }

  if (
    titleText.includes(
      'colecao',
    ) ||
    pathText.includes(
      'colecao',
    )
  ) {
    return {
      kind: 'neighborhood',
      score: 40,
    };
  }

  if (
    isGenericListingPage(
      url,
    )
  ) {
    if (
      containsAny(
        fullText,
        DEVELOPER_TERMS,
      )
    ) {
      return {
        kind: 'developer',
        score: 35,
      };
    }

    return {
      kind: 'other',
      score: 20,
    };
  }

  const projectSignals =
    countTerms(
      fullText,
      PROJECT_WORDS,
    );

  /*
   * Página rasa precisa de mais evidência.
   * Evita transformar home, portal ou
   * listagem genérica em empreendimento.
   */
  if (
    projectSignals >= 2 &&
    depth >= 2
  ) {
    return {
      kind: 'project',
      score:
        Math.min(
          45 +
            projectSignals *
              10,
          80,
        ),
    };
  }

  if (
    containsAny(
      fullText,
      DEVELOPER_TERMS,
    )
  ) {
    return {
      kind: 'developer',
      score: 45,
    };
  }

  if (
    containsAny(
      fullText,
      NEIGHBORHOOD_NAMES,
    ) &&
    depth <= 3
  ) {
    return {
      kind: 'neighborhood',
      score: 35,
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

      queued.add(
        link,
      );

      queue.push({
        url:
          link,

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
