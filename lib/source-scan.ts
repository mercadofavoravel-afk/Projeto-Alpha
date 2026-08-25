import 'server-only';

import {
  isGoogleDriveGatewayUrl,
  isSameNormalizedUrl,
} from '@/lib/source-url';

import {
  discoverSources,
  type DiscoveredSource,
} from '@/lib/source-discovery';

import {
  getEnabledSourceRoots,
  type SourceRoot,
} from '@/lib/source-roots';

export type SourceScanItem =
  DiscoveredSource & {
    sourceRootId: string;
    sourceRootName: string;
    sourceRootUrl: string;
    sourceRootKind:
      SourceRoot['kind'];
    priority: number;
    discoveredViaUrl?: string;
    discoveredFromExternal?: boolean;
  };

export type SourceScanError = {
  sourceRootId: string;
  sourceRootName: string;
  sourceRootUrl: string;
  message: string;
};

export type SourceScanResult = {
  startedAt: string;
  finishedAt: string;
  sourcesScanned: number;
  externalTargetsScanned: number;
  totalDiscovered: number;
  projects: SourceScanItem[];
  neighborhoods: SourceScanItem[];
  documents: SourceScanItem[];
  articles: SourceScanItem[];
  developers: SourceScanItem[];
  other: SourceScanItem[];
  errors: SourceScanError[];
};

export type SourceScanBatchResult =
  SourceScanResult & {
    cursor: number;
    nextCursor: number | null;
    batchSize: number;
    totalSources: number;
    hasMore: boolean;
    sourceIds: string[];
  };

type ScanOptions = {
  maxPagesPerSource?: number;
  maxDepth?: number;
  maxExternalTargetsPerSource?: number;
  maxPagesPerExternalTarget?: number;
  maxExternalDepth?: number;
};

type BatchOptions =
  ScanOptions & {
    cursor?: number;
    batchSize?: number;
  };

type GatewayLink = {
  url: string;
  label: string | null;
};

type ResolvedScanOptions = {
  maxPagesPerSource: number;
  maxDepth: number;
  maxExternalTargetsPerSource: number;
  maxPagesPerExternalTarget: number;
  maxExternalDepth: number;
};

const BLOCKED_EXTERNAL_HOSTS = [
  'instagram.com',
  'facebook.com',
  'linkedin.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'wa.me',
  'whatsapp.com',
  'api.whatsapp.com',
  'telegram.me',
  't.me',
  'spotify.com',
  'music.apple.com',
];

const TECHNICAL_HOSTS = [
  'google.com',
  'accounts.google.com',
  'support.google.com',
  'policies.google.com',
  'gstatic.com',
  'googleusercontent.com',
  'doubleclick.net',
];

function normalizeHost(
  hostname: string,
) {
  return hostname
    .toLowerCase()
    .replace(/^www\./, '');
}

function sameHost(
  first: string,
  second: string,
) {
  try {
    return (
      normalizeHost(
        new URL(first).hostname,
      ) ===
      normalizeHost(
        new URL(second).hostname,
      )
    );
  } catch {
    return false;
  }
}

function normalizeGatewayUrl(
  value: string,
  baseUrl?: string,
) {
  try {
    const url = baseUrl
      ? new URL(
          value,
          baseUrl,
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

    return url.toString();
  } catch {
    return null;
  }
}

function decodeHtml(
  value: string,
) {
  return value
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
      /&lt;/gi,
      '<',
    )
    .replace(
      /&gt;/gi,
      '>',
    )
    .replace(
      /&nbsp;/gi,
      ' ',
    )
    .trim();
}

function stripHtml(
  value: string,
) {
  return decodeHtml(
    value
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        ' ',
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        ' ',
      )
      .replace(
        /<[^>]+>/g,
        ' ',
      )
      .replace(
        /\s+/g,
        ' ',
      ),
  );
}

function isBlockedExternalUrl(
  value: string,
) {
  try {
    const url =
      new URL(value);

    const hostname =
      normalizeHost(
        url.hostname,
      );

    if (
      BLOCKED_EXTERNAL_HOSTS.some(
        (host) =>
          hostname === host ||
          hostname.endsWith(
            `.${host}`,
          ),
      )
    ) {
      return true;
    }

    if (
      TECHNICAL_HOSTS.some(
        (host) =>
          hostname === host ||
          hostname.endsWith(
            `.${host}`,
          ),
      )
    ) {
      return true;
    }

    const pathname =
      url.pathname
        .toLowerCase();

    if (
      /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf|zip|rar|7z)$/i.test(
        pathname,
      )
    ) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

function extractAnchorLinks(
  html: string,
  baseUrl: string,
) {
  const results:
    GatewayLink[] = [];

  const anchorRegex =
    /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;

  let anchorMatch:
    RegExpExecArray | null;

  while (
    (anchorMatch =
      anchorRegex.exec(html))
  ) {
    const attributes =
      anchorMatch[1];

    const content =
      anchorMatch[2];

    const hrefMatch =
      attributes.match(
        /href\s*=\s*["']([^"']+)["']/i,
      );

    if (!hrefMatch?.[1]) {
      continue;
    }

    const normalized =
      normalizeGatewayUrl(
        decodeHtml(
          hrefMatch[1],
        ),
        baseUrl,
      );

    if (!normalized) {
      continue;
    }

    const label =
      stripHtml(content);

    results.push({
      url:
        normalized,
      label:
        label || null,
    });
  }

  return results;
}

function extractAbsoluteUrls(
  html: string,
) {
  const results:
    GatewayLink[] = [];

  const regex =
    /https?:\\?\/\\?\/[^\s"'<>\\]+/gi;

  const matches =
    html.match(regex) ?? [];

  for (
    const rawValue of
    matches
  ) {
    const decoded =
      rawValue
        .replace(
          /\\u002F/gi,
          '/',
        )
        .replace(
          /\\\//g,
          '/',
        )
        .replace(
          /\\u0026/gi,
          '&',
        );

    const normalized =
      normalizeGatewayUrl(
        decoded,
      );

    if (!normalized) {
      continue;
    }

    results.push({
      url:
        normalized,
      label: null,
    });
  }

  return results;
}

function uniqueGatewayLinks(
  links: GatewayLink[],
) {
  const seen =
    new Set<string>();

  const result:
    GatewayLink[] = [];

  for (
    const link of links
  ) {
    const key =
      link.url
        .trim()
        .toLowerCase();

    if (
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    result.push(link);
  }

  return result;
}

async function fetchGatewayHtml(
  url: string,
) {
  const response =
    await fetch(url, {
      cache:
        'no-store',

      redirect:
        'follow',

      headers: {
        Accept:
          'text/html,application/xhtml+xml',

        'User-Agent':
          'Mozilla/5.0 (compatible; ProjetoAlphaIntelligence/1.0; +https://imoveisdealtopadraorio.com.br)',
      },
    });

  if (!response.ok) {
    throw new Error(
      `Gateway respondeu com HTTP ${response.status}.`,
    );
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
    throw new Error(
      'Gateway não retornou HTML navegável.',
    );
  }

  return response.text();
}

async function discoverGatewayTargets(
  root: SourceRoot,
  limit: number,
) {
  const html =
    await fetchGatewayHtml(
      root.url,
    );

  const links =
    uniqueGatewayLinks([
      ...extractAnchorLinks(
        html,
        root.url,
      ),

      ...extractAbsoluteUrls(
        html,
      ),
    ]);

  const filtered =
    links.filter(
      (link) => {
        const internal =
          sameHost(
            root.url,
            link.url,
          );

        if (
          internal &&
          (
            !isGoogleDriveGatewayUrl(
              root.url,
            ) ||
            isSameNormalizedUrl(
              root.url,
              link.url,
            )
          )
        ) {
          return false;
        }

        if (
          isBlockedExternalUrl(
            link.url,
          )
        ) {
          return false;
        }

        return true;
      },
    );

  return filtered.slice(
    0,
    limit,
  );
}

function toScanItem(
  item: DiscoveredSource,
  root: SourceRoot,
  extra?: {
    discoveredViaUrl?: string;
    discoveredFromExternal?: boolean;
  },
): SourceScanItem {
  return {
    ...item,

    sourceRootId:
      root.id,

    sourceRootName:
      root.name,

    sourceRootUrl:
      root.url,

    sourceRootKind:
      root.kind,

    priority:
      root.priority,

    discoveredViaUrl:
      extra?.discoveredViaUrl,

    discoveredFromExternal:
      extra?.discoveredFromExternal,
  };
}

function uniqueItems(
  items: SourceScanItem[],
) {
  const seen =
    new Set<string>();

  return items.filter(
    (item) => {
      const key =
        item.url
          .trim()
          .toLocaleLowerCase(
            'pt-BR',
          );

      if (
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    },
  );
}

function sortItems(
  items: SourceScanItem[],
) {
  return [
    ...items,
  ].sort(
    (a, b) => {
      const scoreDifference =
        b.score -
        a.score;

      if (
        scoreDifference !==
        0
      ) {
        return scoreDifference;
      }

      return (
        b.priority -
        a.priority
      );
    },
  );
}

function resolveScanOptions(
  options: ScanOptions,
): ResolvedScanOptions {
  return {
    maxPagesPerSource:
      Math.max(
        1,
        Math.min(
          options.maxPagesPerSource ??
            40,
          100,
        ),
      ),

    maxDepth:
      Math.max(
        0,
        Math.min(
          options.maxDepth ??
            2,
          4,
        ),
      ),

    maxExternalTargetsPerSource:
      Math.max(
        1,
        Math.min(
          options.maxExternalTargetsPerSource ??
            8,
          20,
        ),
      ),

    maxPagesPerExternalTarget:
      Math.max(
        1,
        Math.min(
          options.maxPagesPerExternalTarget ??
            12,
          30,
        ),
      ),

    maxExternalDepth:
      Math.max(
        0,
        Math.min(
          options.maxExternalDepth ??
            1,
          2,
        ),
      ),
  };
}

async function scanRoot(
  root: SourceRoot,
  options: ResolvedScanOptions,
) {
  const collected:
    SourceScanItem[] = [];

  let externalTargetsScanned =
    0;

  const direct =
    await discoverSources(
      root.url,
      {
        maxPages:
          options.maxPagesPerSource,

        maxDepth:
          options.maxDepth,
      },
    );

  for (
    const item of direct
  ) {
    collected.push(
      toScanItem(
        item,
        root,
      ),
    );
  }

  if (
    !root.followExternalLinks
  ) {
    return {
      items:
        collected,

      externalTargetsScanned,
    };
  }

  const gatewayTargets =
    await discoverGatewayTargets(
      root,
      options.maxExternalTargetsPerSource,
    );

  for (
    const target of
    gatewayTargets
  ) {
    try {
      const discovered =
        await discoverSources(
          target.url,
          {
            maxPages:
              options.maxPagesPerExternalTarget,

            maxDepth:
              options.maxExternalDepth,
          },
        );

      externalTargetsScanned +=
        1;

      for (
        const item of
        discovered
      ) {
        collected.push(
          toScanItem(
            item,
            root,
            {
              discoveredViaUrl:
                target.url,

              discoveredFromExternal:
                true,
            },
          ),
        );
      }
    } catch {
      /*
       * Um destino externo individual
       * nunca deve interromper a fonte.
       */
    }
  }

  return {
    items:
      collected,

    externalTargetsScanned,
  };
}

function buildResult(
  startedAt: string,
  roots: SourceRoot[],
  allItems: SourceScanItem[],
  errors: SourceScanError[],
  externalTargetsScanned: number,
): SourceScanResult {
  const items =
    uniqueItems(
      allItems,
    );

  const projects =
    sortItems(
      items.filter(
        (item) =>
          item.kind ===
          'project',
      ),
    );

  const neighborhoods =
    sortItems(
      items.filter(
        (item) =>
          item.kind ===
          'neighborhood',
      ),
    );

  const documents =
    sortItems(
      items.filter(
        (item) =>
          item.kind ===
          'document',
      ),
    );

  const articles =
    sortItems(
      items.filter(
        (item) =>
          item.kind ===
          'article',
      ),
    );

  const developers =
    sortItems(
      items.filter(
        (item) =>
          item.kind ===
          'developer',
      ),
    );

  const other =
    sortItems(
      items.filter(
        (item) =>
          item.kind ===
          'other',
      ),
    );

  return {
    startedAt,

    finishedAt:
      new Date()
        .toISOString(),

    sourcesScanned:
      roots.length,

    externalTargetsScanned,

    totalDiscovered:
      items.length,

    projects,
    neighborhoods,
    documents,
    articles,
    developers,
    other,
    errors,
  };
}

async function scanRoots(
  roots: SourceRoot[],
  options: ResolvedScanOptions,
) {
  const startedAt =
    new Date()
      .toISOString();

  const allItems:
    SourceScanItem[] = [];

  const errors:
    SourceScanError[] = [];

  let externalTargetsScanned =
    0;

  for (
    const root of roots
  ) {
    try {
      const rootResult =
        await scanRoot(
          root,
          options,
        );

      externalTargetsScanned +=
        rootResult
          .externalTargetsScanned;

      allItems.push(
        ...rootResult.items,
      );
    } catch (error) {
      errors.push({
        sourceRootId:
          root.id,

        sourceRootName:
          root.name,

        sourceRootUrl:
          root.url,

        message:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido durante a varredura.',
      });
    }
  }

  return buildResult(
    startedAt,
    roots,
    allItems,
    errors,
    externalTargetsScanned,
  );
}

export async function scanSourceBatch(
  options: BatchOptions = {},
): Promise<SourceScanBatchResult> {
  const allRoots =
    getEnabledSourceRoots();

  const totalSources =
    allRoots.length;

  const cursor =
    Math.max(
      0,
      Math.min(
        Math.floor(
          options.cursor ??
            0,
        ),
        totalSources,
      ),
    );

  const batchSize =
    Math.max(
      1,
      Math.min(
        Math.floor(
          options.batchSize ??
            3,
        ),
        5,
      ),
    );

  const batchRoots =
    allRoots.slice(
      cursor,
      cursor + batchSize,
    );

  const resolvedOptions =
    resolveScanOptions(
      options,
    );

  const result =
    await scanRoots(
      batchRoots,
      resolvedOptions,
    );

  const calculatedNext =
    cursor +
    batchRoots.length;

  const hasMore =
    calculatedNext <
    totalSources;

  return {
    ...result,

    cursor,

    nextCursor:
      hasMore
        ? calculatedNext
        : null,

    batchSize:
      batchRoots.length,

    totalSources,

    hasMore,

    sourceIds:
      batchRoots.map(
        (root) =>
          root.id,
      ),
  };
}

export async function scanAllSources(
  options: ScanOptions = {},
): Promise<SourceScanResult> {
  const roots =
    getEnabledSourceRoots();

  const resolvedOptions =
    resolveScanOptions(
      options,
    );

  return scanRoots(
    roots,
    resolvedOptions,
  );
}
