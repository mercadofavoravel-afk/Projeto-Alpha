import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiPermission } from '@/lib/auth';
import { processBookContent } from '@/lib/book-processor';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const auth =
    await requireApiPermission(
      'media:write',
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

  const { id } = await context.params;

  const book =
    await db.bookIngestion.findUnique({
      where: {
        id,
      },
    });

  if (!book) {
    return NextResponse.json(
      {
        error: 'Book não encontrado',
      },
      {
        status: 404,
      },
    );
  }

  await db.bookIngestion.update({
    where: {
      id,
    },
    data: {
      status: 'PROCESSING',
      progress: 20,
      error: null,
    },
  });

  try {
    const result =
      await processBookContent({
        fileName: book.fileName,
        storageUrl: book.storageUrl,
        mimeType: book.mimeType,
        extracted: book.extracted,
      });

    if (!result.ok) {
      const failed =
        await db.bookIngestion.update({
          where: {
            id,
          },
          data: {
            status: 'FAILED',
            progress: 100,
            error: result.message,
          },
        });

      return NextResponse.json(
        {
          ok: false,
          book: failed,
          message: result.message,
          characterCount:
            result.characterCount,
          source: result.source,
        },
        {
          status: 422,
        },
      );
    }

    const completed =
      await db.bookIngestion.update({
        where: {
          id,
        },
        data: {
          status: 'COMPLETED',
          progress: 100,
          error: null,
          extracted: {
            text: result.text,
            characterCount:
              result.characterCount,
            source: result.source,
            mimeType: result.mimeType,
            processedAt:
              new Date().toISOString(),
          },
        },
      });

    return NextResponse.json({
      ok: true,
      book: completed,
      message: result.message,
      characterCount:
        result.characterCount,
      source: result.source,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro inesperado ao processar o material.';

    await db.bookIngestion.update({
      where: {
        id,
      },
      data: {
        status: 'FAILED',
        progress: 100,
        error: message,
      },
    });

    console.error(
      'Erro ao processar Book:',
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}
