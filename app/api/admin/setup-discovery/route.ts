import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Não autenticado',
      },
      {
        status: 401,
      },
    );
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Somente administradores podem executar esta operação.',
      },
      {
        status: 403,
      },
    );
  }

  try {
    await db.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'DiscoveryCandidateStatus'
        ) THEN
          CREATE TYPE "DiscoveryCandidateStatus" AS ENUM (
            'PENDING',
            'APPROVED',
            'REJECTED',
            'IMPORTED'
          );
        END IF;
      END
      $$;
    `);

    await db.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'DiscoveryCandidateKind'
        ) THEN
          CREATE TYPE "DiscoveryCandidateKind" AS ENUM (
            'PROJECT',
            'NEIGHBORHOOD',
            'DOCUMENT',
            'ARTICLE',
            'DEVELOPER',
            'OTHER'
          );
        END IF;
      END
      $$;
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DiscoveryCandidate" (
        "id" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "title" TEXT,
        "kind" "DiscoveryCandidateKind" NOT NULL,
        "score" INTEGER NOT NULL DEFAULT 0,
        "status" "DiscoveryCandidateStatus" NOT NULL DEFAULT 'PENDING',

        "sourceRootId" TEXT NOT NULL,
        "sourceRootName" TEXT NOT NULL,
        "sourceRootUrl" TEXT NOT NULL,
        "sourceRootKind" TEXT,

        "importedProjectId" TEXT,
        "metadata" JSONB,

        "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "reviewedAt" TIMESTAMP(3),
        "importedAt" TIMESTAMP(3),

        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "DiscoveryCandidate_pkey"
          PRIMARY KEY ("id")
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS
        "DiscoveryCandidate_url_key"
      ON
        "DiscoveryCandidate"("url");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS
        "DiscoveryCandidate_status_idx"
      ON
        "DiscoveryCandidate"("status");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS
        "DiscoveryCandidate_kind_idx"
      ON
        "DiscoveryCandidate"("kind");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS
        "DiscoveryCandidate_score_idx"
      ON
        "DiscoveryCandidate"("score");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS
        "DiscoveryCandidate_sourceRootId_idx"
      ON
        "DiscoveryCandidate"("sourceRootId");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS
        "DiscoveryCandidate_importedProjectId_idx"
      ON
        "DiscoveryCandidate"("importedProjectId");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS
        "DiscoveryCandidate_lastSeenAt_idx"
      ON
        "DiscoveryCandidate"("lastSeenAt");
    `);

    const tableCheck =
      await db.$queryRaw<
        Array<{
          table_name: string;
        }>
      >`
        SELECT table_name
        FROM information_schema.tables
        WHERE
          table_schema = 'public'
          AND table_name = 'DiscoveryCandidate'
      `;

    if (tableCheck.length !== 1) {
      throw new Error(
        'A tabela DiscoveryCandidate não foi encontrada após a configuração.',
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        'Estrutura DiscoveryCandidate criada e verificada com sucesso.',
      table:
        tableCheck[0].table_name,
    });
  } catch (error) {
    console.error(
      'Erro ao configurar DiscoveryCandidate:',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível configurar a fila de candidatos.',
      },
      {
        status: 500,
      },
    );
  }
}
