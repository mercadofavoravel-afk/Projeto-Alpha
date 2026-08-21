import 'server-only';

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
  totalDiscovered: number;
  projects: SourceScanItem[];
  neighborhoods: SourceScanItem[];
  documents: SourceScanItem[];
  articles: SourceScanItem[];
  developers: SourceScanItem[];
  other: SourceScanItem[];
  errors: SourceScanError[];
};

type ScanOptions = {
  maxPagesPerSource?: number;
  maxDepth?: number;
};

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

      if (seen.has(key)) {
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
  return [...items].sort(
    (a, b) => {
      const scoreDifference =
        b.score - a.score;

      if (
        scoreDifference !== 0
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

export async function scanAllSources(
  options: ScanOptions = {},
): Promise<SourceScanResult> {
  const startedAt =
    new Date().toISOString();

  const roots =
    getEnabledSourceRoots();

  const allItems:
    SourceScanItem[] = [];

  const errors:
    SourceScanError[] = [];

  for (const root of roots) {
    try {
      const discovered =
        await discoverSources(
          root.url,
          {
            maxPages:
              options.maxPagesPerSource ??
              40,

            maxDepth:
              options.maxDepth ??
              2,
          },
        );

      for (
        const item of
        discovered
      ) {
        allItems.push({
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
        });
      }
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
      new Date().toISOString(),

    sourcesScanned:
      roots.length,

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
