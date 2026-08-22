import { NextResponse } from 'next/server';
import {
  DiscoveryCandidateKind,
} from '@prisma/client';
import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  scanSourceBatch,
  type SourceScanItem,
} from '@/lib/source-scan';

export const dynamic = 'force-dynamic';

type ScanRequestBody = {
  cursor?: number;
  batchSize?: number;
};

function mapCandidateKind(
  kind: SourceScanItem['kind'],
): DiscoveryCandidateKind {
  switch (kind) {
    case 'project':
      return DiscoveryCandidateKind.PROJECT;

    case 'neighborhood':
      return DiscoveryCandidateKind.NEIGHBORHOOD;

    case 'document':
      return DiscoveryCandidateKind.DOCUMENT;

    case 'article':
      return DiscoveryCandidateKind.ARTICLE;

    case 'developer':
      return DiscoveryCandidateKind.DEVELOPER;

    default:
      return DiscoveryCandidateKind.OTHER;
  }
}

async function persistCandidates(
  items: SourceScanItem[],
) {
  let created = 0;
  let updated = 0;

  for (const item of items) {
    const existing =
      await db.discoveryCandidate.findUnique({
        where: {
          url: item.url,
        },

        select: {
          id: true,
        },
      });

    const metadata = {
      priority:
        item.priority,

      discoveredKind:
        item.kind,

      discoveredViaUrl:
        item.discoveredViaUrl ??
        null,

      discoveredFromExternal:
        item.discoveredFromExternal ??
        false,

      lastScanAt:
        new Date()
          .toISOString(),
    };

    if (existing) {
      await db.discoveryCandidate.update({
        where: {
          id: existing.id,
        },

        data: {
          title:
            item.title,

          kind:
            mapCandidateKind(
              item.kind,
            ),

          score:
            item.score,

          sourceRootId:
            item.sourceRootId,

          sourceRootName:
            item.sourceRootName,

          sourceRootUrl:
            item.sourceRootUrl,

          sourceRootKind:
            item.sourceRootKind,

          lastSeenAt:
            new Date(),

          metadata,
        },
      });

      updated += 1;

      continue;
    }

    await db.discoveryCandidate.create({
      data: {
        url:
          item.url,

        title:
          item.title,

        kind:
          mapCandidateKind(
            item.kind,
          ),

        score:
          item.score,

        sourceRootId:
          item.sourceRootId,

        sourceRootName:
          item.sourceRootName,

        sourceRootUrl:
          item.sourceRootUrl,

        sourceRootKind:
          item.sourceRootKind,

        metadata: {
          ...metadata,

          firstScanAt:
            new Date()
              .toISOString(),
        },
      },
    });

    created += 1;
  }

  return {
    created,
    updated,
    total:
      created +
      updated,
  };
}

async function getQueueSummary() {
  const queueSummary =
    await db.discoveryCandidate.groupBy({
      by: [
        'status',
      ],

      _count: {
        _all: true,
      },
    });

  return {
    pending:
      queueSummary.find(
        (item) =>
          item.status ===
          'PENDING',
      )?._count._all ??
      0,

    approved:
      queueSummary.find(
        (item) =>
          item.status ===
          'APPROVED',
      )?._count._all ??
      0,

    rejected:
      queueSummary.find(
        (item) =>
          item.status ===
          'REJECTED',
      )?._count._all ??
      0,

    imported:
      queueSummary.find(
        (item) =>
          item.status ===
          'IMPORTED',
      )?._count._all ??
      0,
  };
}

async function readRequestBody(
  request: Request,
): Promise<ScanRequestBody> {
  try {
    const body =
      (await request.json()) as
        ScanRequestBody;

    return body ?? {};
  } catch {
    return {};
  }
}

export async function POST(
  request: Request,
) {
  const auth =
    await requireApiPermission(
      'catalog:write',
    );

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          auth.error,
      },
      {
        status:
          auth.status,
      },
    );
  }

  try {
    const body =
      await readRequestBody(
        request,
      );

    const cursor =
      Number.isFinite(
        body.cursor,
      )
        ? Math.max(
            0,
            Math.floor(
              body.cursor ??
                0,
            ),
          )
        : 0;

    const batchSize =
      Number.isFinite(
        body.batchSize,
      )
        ? Math.max(
            1,
            Math.min(
              Math.floor(
                body.batchSize ??
                  3,
              ),
              3,
            ),
          )
        : 3;

    const result =
      await scanSourceBatch({
        cursor,
        batchSize,

        /*
         * O lote é deliberadamente
         * menor que a antiga varredura
         * total para evitar timeout.
         */
        maxPagesPerSource:
          30,

        maxDepth:
          2,

        maxExternalTargetsPerSource:
          5,

        maxPagesPerExternalTarget:
          8,

        maxExternalDepth:
          1,
      });

    const allCandidates:
      SourceScanItem[] = [
        ...result.projects,
        ...result.neighborhoods,
        ...result.documents,
        ...result.articles,
        ...result.developers,
        ...result.other,
      ];

    const persistence =
      await persistCandidates(
        allCandidates,
      );

    const queue =
      await getQueueSummary();

    return NextResponse.json({
      ok: true,

      batch: {
        cursor:
          result.cursor,

        nextCursor:
          result.nextCursor,

        batchSize:
          result.batchSize,

        totalSources:
          result.totalSources,

        hasMore:
          result.hasMore,

        sourceIds:
          result.sourceIds,

        externalTargetsScanned:
          result.externalTargetsScanned,
      },

      summary: {
        sourcesScanned:
          result.sourcesScanned,

        totalDiscovered:
          result.totalDiscovered,

        projects:
          result.projects.length,

        neighborhoods:
          result.neighborhoods.length,

        documents:
          result.documents.length,

        articles:
          result.articles.length,

        developers:
          result.developers.length,

        other:
          result.other.length,

        errors:
          result.errors.length,
      },

      persistence: {
        created:
          persistence.created,

        updated:
          persistence.updated,

        total:
          persistence.total,

        queue,
      },

      result,
    });
  } catch (error) {
    console.error(
      'Erro no lote de varredura das fontes:',
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível executar o lote de varredura das fontes.',
      },
      {
        status: 500,
      },
    );
  }
}
