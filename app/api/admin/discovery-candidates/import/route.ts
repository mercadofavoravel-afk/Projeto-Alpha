import { NextResponse } from 'next/server';
import { DiscoveryCandidateKind, DiscoveryCandidateStatus } from '@prisma/client';

import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type CandidateStatusFilter = DiscoveryCandidateStatus | 'ALL';

type CandidateKindFilter = DiscoveryCandidateKind | 'ALL';

type CandidateFilterInput = {
  status?: unknown;
  kind?: unknown;
  search?: unknown;
  minScore?: unknown;
  market?: unknown;
};

type ImportBody = {
  ids?: string[];
  scope?: 'FILTERED';
  filters?: CandidateFilterInput;
};

const RIO_TERMS = [
  'rio de janeiro',
  '/rj/',
  'barra da tijuca',
  'barra-da-tijuca',
  'recreio',
  'ipanema',
  'leblon',
  'copacabana',
  'botafogo',
  'flamengo',
  'laranjeiras',
  'gloria',
  'sao conrado',
  'sao-conrado',
  'gavea',
  'lagoa',
  'jardim botanico',
  'jardim-botanico',
  'jardim oceanico',
  'jardim-oceanico',
  'peninsula',
  'arpoador',
];

function parseStatus(value: unknown): CandidateStatusFilter {
  if (value === 'ALL') {
    return 'ALL';
  }

  if (
    typeof value === 'string' &&
    Object.values(DiscoveryCandidateStatus).includes(value as DiscoveryCandidateStatus)
  ) {
    return value as DiscoveryCandidateStatus;
  }

  return DiscoveryCandidateStatus.PENDING;
}

function parseKind(value: unknown): CandidateKindFilter {
  if (value === 'ALL') {
    return 'ALL';
  }

  if (
    typeof value === 'string' &&
    Object.values(DiscoveryCandidateKind).includes(value as DiscoveryCandidateKind)
  ) {
    return value as DiscoveryCandidateKind;
  }

  return 'ALL';
}

function parseMinScore(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);

  return Math.max(0, Math.min(Number.isFinite(parsed) ? parsed : 0, 100));
}

function candidateWhere(filters: CandidateFilterInput) {
  const status = parseStatus(filters.status);
  const kind = parseKind(filters.kind);
  const search = typeof filters.search === 'string' ? filters.search.trim().slice(0, 160) : '';
  const minScore = parseMinScore(filters.minScore);
  const market = filters.market === 'ALL' ? 'ALL' : 'RIO';

  return {
    ...(status !== 'ALL' ? { status } : {}),
    ...(kind !== 'ALL' ? { kind } : {}),
    ...(market === 'RIO'
      ? {
          AND: [
            {
              OR: RIO_TERMS.flatMap((term) => [
                {
                  title: {
                    contains: term,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  url: {
                    contains: term,
                    mode: 'insensitive' as const,
                  },
                },
              ]),
            },
          ],
        }
      : {}),
    ...(minScore > 0
      ? {
          score: {
            gte: minScore,
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              url: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              sourceRootName: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };
}

export async function POST(request: Request) {
  const auth = await requireApiPermission('catalog:write');

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: auth.error,
      },
      {
        status: auth.status,
      },
    );
  }

  try {
    const body = (await request.json()) as ImportBody;
    const importAllMatching = body.scope === 'FILTERED';
    const ids = Array.from(
      new Set(
        (Array.isArray(body.ids) ? body.ids : [])
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ).slice(0, 100);

    if (!importAllMatching && ids.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Informe os candidatos aprovados que devem ser importados.',
        },
        {
          status: 400,
        },
      );
    }

    const filters = body.filters ?? {};

    if (importAllMatching && parseStatus(filters.status) !== DiscoveryCandidateStatus.APPROVED) {
      return NextResponse.json(
        {
          ok: false,
          error: 'A importação em lote aceita somente candidatos aprovados.',
        },
        {
          status: 400,
        },
      );
    }

    const candidates = await db.discoveryCandidate.findMany({
      where: importAllMatching
        ? candidateWhere(filters)
        : {
            id: {
              in: ids,
            },
            status: DiscoveryCandidateStatus.APPROVED,
          },
      select: {
        id: true,
        title: true,
        url: true,
      },
    });

    if (!importAllMatching && candidates.length !== ids.length) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Todos os candidatos precisam estar aprovados antes da importação.',
        },
        {
          status: 400,
        },
      );
    }

    if (candidates.length === 0) {
      return NextResponse.json({
        ok: true,
        imported: 0,
        evidenceCreated: 0,
      });
    }

    const now = new Date();

    const evidenceCreated = await db.$transaction(async (transaction) => {
      let created = 0;

      for (const candidate of candidates) {
        const existing = await transaction.sourceRecord.findFirst({
          where: {
            kind: 'DISCOVERY_EVIDENCE',
            storageUrl: candidate.url,
          },
          select: {
            id: true,
          },
        });

        if (!existing) {
          await transaction.sourceRecord.create({
            data: {
              kind: 'DISCOVERY_EVIDENCE',
              title: candidate.title ?? candidate.url,
              storageUrl: candidate.url,
              extractedAt: now,
            },
          });

          created += 1;
        }
      }

      await transaction.discoveryCandidate.updateMany({
        where: {
          id: {
            in: candidates.map((candidate) => candidate.id),
          },
          status: DiscoveryCandidateStatus.APPROVED,
        },
        data: {
          status: DiscoveryCandidateStatus.IMPORTED,
          importedAt: now,
        },
      });

      return created;
    });

    return NextResponse.json({
      ok: true,
      imported: candidates.length,
      evidenceCreated,
    });
  } catch (error) {
    console.error('Erro ao importar candidatos de discovery:', error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível importar os candidatos aprovados.',
      },
      {
        status: 500,
      },
    );
  }
}
