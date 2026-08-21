import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth';
import { collectNeighborhoodEvidence } from '@/lib/neighborhood-evidence-collector';
import { enrichAndStoreNeighborhood } from '@/lib/neighborhood-enrichment-store';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const permission =
    await requireApiPermission(
      'catalog:write',
    );

  if (!permission.ok) {
    return NextResponse.json(
      {
        error: permission.error,
      },
      {
        status: permission.status,
      },
    );
  }

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error:
            'ID do bairro não informado.',
        },
        {
          status: 400,
        },
      );
    }

    const evidence =
      await collectNeighborhoodEvidence(
        id,
      );

    const result =
      await enrichAndStoreNeighborhood(
        id,
        evidence,
      );

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: result.message,
          evidenceCount:
            result.evidenceCount,
          sourceCount:
            result.sourceUrls.length,
        },
        {
          status: 422,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
      neighborhoodId:
        result.neighborhoodId,
      neighborhoodSlug:
        result.neighborhoodSlug,
      evidenceCount:
        result.evidenceCount,
      sourceCount:
        result.sourceUrls.length,
    });
  } catch (error) {
    console.error(
      'Erro ao enriquecer bairro:',
      error,
    );

    return NextResponse.json(
      {
        error:
          'Não foi possível gerar o conteúdo do bairro neste momento.',
      },
      {
        status: 500,
      },
    );
  }
}
