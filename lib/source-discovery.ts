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
      const key of [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'fbclid',
        'gclid',
      ]
    ) {
      url.searchParams.delete(key);
    }

    if (
      url.pathname.length > 1 &&
      url.pathname.endsWith('/')
    ) {
      url.pathname =
        url.pathname.slice(0, -1);
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
    const url = new URL(candidate);

    return (
      url.hostname
        .replace(/^www\./, '') ===
      root.hostname
        .replace(/^www\./, '')
    );
  } catch {
    return false;
  }
}

function stripHtml(value: string) {
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
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(
  html: string,
) {
  const match = html.match(
    /<title[^>]*>([\s\S]*?)<\/title>/i,
  );

  if (!match?.[1]) {
    return null;
  }

  const title = stripHtml(
    match[1],
  );

  return title || null;
}

function extractLinks(
  html: string,
  baseUrl: string,
) {
  const links: string[] = [];

  const regex =
    /<a\s[^>]*href=["']([^"']+)["'][^>]*>/gi;

  let match: RegExpExecArray | null;

  while (
    (match = regex.exec(html))
  ) {
    const normalized =
      normalizeUrl(
        match[1],
        baseUrl,
      );

    if (normalized) {
      links.push(normalized);
    }
  }

  return [
    ...new Set(links),
  ];
}

function classifyUrl(
  url: string,
  title: string | null,
): Pick<
  DiscoveredSource,
  'kind' | 'score'
> {
  const text = `${url} ${
    title ?? ''
  }`
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLocaleLowerCase(
      'pt-BR',
    );

  let kind:
    DiscoveredSource['kind'] =
    'other';

  let score = 0;

  if (
    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(
      new URL(url).pathname,
    )
  ) {
    return {
      kind: 'document',
      score: 95,
    };
  }

  if (
    [
      'empreendimento',
      'empreendimentos',
      'lancamento',
      'lancamentos',
      'residencial',
      'project',
      'projects',
      'produto',
      'imovel',
      'imoveis',
    ].some((term) =>
      text.includes(term),
    )
  ) {
    kind = 'project';
    score += 60;
  }

  if (
    [
      'bairro',
      'bairros',
      'ipanema',
      'leblon',
      'copacabana',
      'arpoador',
      'barra-da-tijuca',
      'barra da tijuca',
      'flamengo',
      'laranjeiras',
      'jardim-oceanico',
      'jardim oceanico',
      'sao-conrado',
      'sao conrado',
      'gavea',
      'lagoa',
      'joa',
      'recreio',
      'peninsula',
      'abm',
    ].some((term) =>
      text.includes(term),
    )
  ) {
    if (
      kind === 'other'
    ) {
      kind =
        'neighborhood';
    }

    score += 35;
  }

  if (
    [
      'incorporadora',
      'construtora',
      'developer',
      'empresa',
      'sobre',
      'institucional',
    ].some((term) =>
      text.includes(term),
    )
  ) {
    if (
      kind === 'other'
    ) {
      kind = 'developer';
    }

    score += 20;
  }

  if (
    [
      'blog',
      'noticia',
      'noticias',
      'artigo',
      'artigos',
      'conteudo',
      'mercado',
      'tendencias',
    ].some((term) =>
      text.includes(term),
    )
  ) {
    if (
      kind === 'other'
    ) {
      kind = 'article';
    }

    score += 20;
  }

  const path =
    new URL(url).pathname;

  const depth =
    path
      .split('/')
      .filter(Boolean)
      .length;

  if (depth >= 2) {
    score += 10;
  }

  if (
    title &&
    title.length >= 15
  ) {
    score += 5;
  }

  return {
    kind,
    score:
      Math.min(
        score,
        100,
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
          'ProjetoAlphaSourceDiscovery/1.0',
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
        options.maxDepth ?? 2,
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

    visited.add(
      current.url,
    );

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
        visited.has(link)
      ) {
        continue;
      }

      const pathname =
        new URL(
          link,
        ).pathname.toLowerCase();

      if (
        /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf|mp4|webm|mov|zip)$/i.test(
          pathname,
        )
      ) {
        continue;
      }

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
