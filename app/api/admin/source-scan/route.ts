import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth';
import { scanAllSources } from '@/lib/source-scan';

export const dynamic = 'force-dynamic';

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
