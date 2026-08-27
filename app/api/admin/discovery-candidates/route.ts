import { NextResponse } from 'next/server';
import {
  DiscoveryCandidateKind,
  DiscoveryCandidateStatus,
} from '@prisma/client';

import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type CandidateStatusFilter =
  | DiscoveryCandidateStatus
  | 'ALL';

type CandidateKindFilter =
  | DiscoveryCandidateKind
  | 'ALL';

type PatchBody = {
  id?: string;
  ids?: string[];
  status?: DiscoveryCandidateStatus;
};

function parseStatus(
  value: string | null,
): CandidateStatusFilter {
  if (!value) {
    return DiscoveryCandidateStatus.PENDING;
  }

  if (value === 'ALL') {
    return 'ALL';
  }

  if (
    Object.values(
      DiscoveryCandidateStatus,
    ).includes(
      value as DiscoveryCandidateStatus,
    )
  ) {
    return value as DiscoveryCandidateStatus;
  }

  return DiscoveryCandidateStatus.PENDING;
}

function parseKind(
  value: string | null,
): CandidateKindFilter {
  if (!value) {
    return 'ALL';
  }

  if (value === 'ALL') {
    return 'ALL';
  }

  if (
    Object.values(
      DiscoveryCandidateKind,
    ).includes(
      value as DiscoveryCandidateKind,
    )
  ) {
    return value as DiscoveryCandidateKind;
  }

  return 'ALL';
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
  max: number,
) {
  const parsed =
    Number.parseInt(
      value ?? '',
      10,
    );

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return Math.min(
    parsed,
    max,
  );
}

export async function GET(
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
        error: auth.error,
      },
      {
        status: auth.status,
      },
    );
  }

  try {
    const url =
      new URL(request.url);

    const status =
      parseStatus(
        url.searchParams.get(
          'status',
        ),
      );

    const kind =
      parseKind(
        url.searchParams.get(
          'kind',
        ),
      );

    const search =
      (
        url.searchParams.get(
          'search',
        ) ?? ''
      )
        .trim()
        .slice(
          0,
          160,
        );

    const page =
      parsePositiveInteger(
        url.searchParams.get(
          'page',
        ),
        1,
        10000,
      );

    const pageSize =
      parsePositiveInteger(
        url.searchParams.get(
          'pageSize',
        ),
        30,
        100,
      );

    const where = {
      ...(status !== 'ALL'
        ? {
            status,
          }
        : {}),

      ...(kind !== 'ALL'
        ? {
            kind,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                title: {
                  contains:
                    search,
                  mode:
                    'insensitive' as const,
                },
              },

              {
                url: {
                  contains:
                    search,
                  mode:
                    'insensitive' as const,
                },
              },

              {
                sourceRootName: {
                  contains:
                    search,
                  mode:
                    'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [
      items,
      total,
      statusGroups,
      kindGroups,
    ] =
      await Promise.all([
        db.discoveryCandidate.findMany({
          where,

          orderBy: [
            {
              score: 'desc',
            },

            {
              lastSeenAt:
                'desc',
            },

            {
              createdAt:
                'desc',
            },
          ],

          skip:
            (page - 1) *
            pageSize,

          take:
            pageSize,
        }),

        db.discoveryCandidate.count({
          where,
        }),

        db.discoveryCandidate.groupBy({
          by: [
            'status',
          ],

          _count: {
            _all: true,
          },
        }),

        db.discoveryCandidate.groupBy({
          by: [
            'kind',
          ],

          _count: {
            _all: true,
          },
        }),
      ]);

    const statusSummary = {
      pending:
        statusGroups.find(
          (item) =>
            item.status ===
            DiscoveryCandidateStatus.PENDING,
        )?._count._all ??
        0,

      approved:
        statusGroups.find(
          (item) =>
            item.status ===
            DiscoveryCandidateStatus.APPROVED,
        )?._count._all ??
        0,

      rejected:
        statusGroups.find(
          (item) =>
            item.status ===
            DiscoveryCandidateStatus.REJECTED,
        )?._count._all ??
        0,

      imported:
        statusGroups.find(
          (item) =>
            item.status ===
            DiscoveryCandidateStatus.IMPORTED,
        )?._count._all ??
        0,
    };

    const kindSummary = {
      projects:
        kindGroups.find(
          (item) =>
            item.kind ===
            DiscoveryCandidateKind.PROJECT,
        )?._count._all ??
        0,

      neighborhoods:
        kindGroups.find(
          (item) =>
            item.kind ===
            DiscoveryCandidateKind.NEIGHBORHOOD,
        )?._count._all ??
        0,

      documents:
        kindGroups.find(
          (item) =>
            item.kind ===
            DiscoveryCandidateKind.DOCUMENT,
        )?._count._all ??
        0,

      articles:
        kindGroups.find(
          (item) =>
            item.kind ===
            DiscoveryCandidateKind.ARTICLE,
        )?._count._all ??
        0,

      developers:
        kindGroups.find(
          (item) =>
            item.kind ===
            DiscoveryCandidateKind.DEVELOPER,
        )?._count._all ??
        0,

      other:
        kindGroups.find(
          (item) =>
            item.kind ===
            DiscoveryCandidateKind.OTHER,
        )?._count._all ??
        0,
    };

    return NextResponse.json({
      ok: true,

      filters: {
        status,
        kind,
        search,
      },

      pagination: {
        page,
        pageSize,
        total,

        totalPages:
          Math.max(
            1,
            Math.ceil(
              total /
                pageSize,
            ),
          ),
      },

      summary: {
        status:
          statusSummary,

        kind:
          kindSummary,
      },

      items,
    });
  } catch (error) {
    console.error(
      'Erro ao listar candidatos de discovery:',
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a fila de candidatos.',
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
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
        error: auth.error,
      },
      {
        status: auth.status,
      },
    );
  }

  try {
    const body =
      (await request.json()) as
        PatchBody;

    const ids = Array.from(
      new Set(
        [
          ...(Array.isArray(body.ids) ? body.ids : []),
          ...(body.id ? [body.id] : []),
        ]
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ).slice(0, 100);

    if (ids.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'O candidato não foi informado.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      !body.status ||
      !Object.values(
        DiscoveryCandidateStatus,
      ).includes(
        body.status,
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Status inválido.',
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await db.discoveryCandidate.findMany({
        where: {
          id: {
            in: ids,
          },
        },

        select: {
          id: true,
          status: true,
        },
      });

    if (existing.length !== ids.length) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Candidato não encontrado.',
        },
        {
          status: 404,
        },
      );
    }

    /*
     * IMPORTED será utilizado pela
     * futura rotina de importação.
     * Nesta tela de revisão manual
     * permitimos apenas os estados
     * de triagem.
     */
    if (
      body.status ===
      DiscoveryCandidateStatus.IMPORTED
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'O status IMPORTED só pode ser definido pelo processo de importação.',
        },
        {
          status: 400,
        },
      );
    }

    const now =
      new Date();

    const result =
      await db.discoveryCandidate.updateMany({
        where: {
          id: {
            in: ids,
          },
        },

        data: {
          status:
            body.status,

          reviewedAt:
            body.status ===
            DiscoveryCandidateStatus.PENDING
              ? null
              : now,
        },
      });

    return NextResponse.json({
      ok: true,
      updated: result.count,
    });
  } catch (error) {
    console.error(
      'Erro ao revisar candidato de discovery:',
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível atualizar o candidato.',
      },
      {
        status: 500,
      },
    );
  }
}
