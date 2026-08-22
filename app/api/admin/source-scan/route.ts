import { NextResponse } from 'next/server';
import {
  DiscoveryCandidateKind,
} from '@prisma/client';
import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  scanAllSources,
  type SourceScanItem,
} from '@/lib/source-scan';

export const dynamic = 'force-dynamic';

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

    if (existing) {
      await db.discoveryCandidate.update({
        where: {
          id: existing.id,
        },

        data: {
          title: item.title,

          kind:
            mapCandidateKind(
              item.kind,
            ),

          score: item.score,

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

          metadata: {
            priority:
              item.priority,

            discoveredKind:
              item.kind,

            lastScanAt:
              new Date()
                .toISOString(),
          },
        },
      });

      updated += 1;

      continue;
    }

    await db.discoveryCandidate.create({
      data: {
        url: item.url,

        title: item.title,

        kind:
          mapCandidateKind(
            item.kind,
          ),

        score: item.score,

        sourceRootId:
          item.sourceRootId,

        sourceRootName:
          item.sourceRootName,

        sourceRootUrl:
          item.sourceRootUrl,

        sourceRootKind:
          item.sourceRootKind,

        metadata: {
          priority:
            item.priority,

          discoveredKind:
            item.kind,

          firstScanAt:
            new Date()
              .toISOString(),

          lastScanAt:
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
      created + updated,
  };
}

export async function POST() {
  const auth =
    await requireApiPermission(
      'catalog:write',
    );

  if (!auth.ok) {
    return NextResponse.json(
      {
        error: auth.error,
      },
      {
        status: auth.status,
      },
    );
  }

  try {
    const result =
      await scanAllSources({
        maxPagesPerSource: 40,
        maxDepth: 2,
      });

    const allCandidates: SourceScanItem[] = [
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

    const queueSummary =
      await db.discoveryCandidate.groupBy({
        by: [
          'status',
        ],

        _count: {
          _all: true,
        },
      });

    const pending =
      queueSummary.find(
        (item) =>
          item.status ===
          'PENDING',
      )?._count._all ?? 0;

    const approved =
      queueSummary.find(
        (item) =>
          item.status ===
          'APPROVED',
      )?._count._all ?? 0;

    const rejected =
      queueSummary.find(
        (item) =>
          item.status ===
          'REJECTED',
      )?._count._all ?? 0;

    const imported =
      queueSummary.find(
        (item) =>
          item.status ===
          'IMPORTED',
      )?._count._all ?? 0;

    return NextResponse.json({
      ok: true,

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

        queue: {
          pending,
          approved,
          rejected,
          imported,
        },
      },

      result,
    });
  } catch (error) {
    console.error(
      'Erro na varredura das fontes:',
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível executar a varredura das fontes.',
      },
      {
        status: 500,
      },
    );
  }
}
