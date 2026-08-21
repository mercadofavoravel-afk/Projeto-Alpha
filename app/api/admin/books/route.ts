import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireApiPermission,
  requireApiUser,
} from '@/lib/auth';
import { audit } from '@/lib/audit';
import { processBookContent } from '@/lib/book-processor';

function inferMimeType(
  url: string,
  provided?: string,
) {
  if (provided?.trim()) {
    return provided.trim();
  }

  const lower = url
    .toLocaleLowerCase('pt-BR')
    .split('?')[0];

  if (lower.endsWith('.pdf')) {
    return 'application/pdf';
  }

  if (lower.endsWith('.json')) {
    return 'application/json';
  }

  if (
    lower.endsWith('.txt') ||
    lower.endsWith('.md')
  ) {
    return 'text/plain';
  }

  return 'text/html';
}

function inferFileName(
  url: string,
  provided?: string,
) {
  if (provided?.trim()) {
    return provided.trim();
  }

  try {
    const parsed = new URL(url);

    const lastPart =
      parsed.pathname
        .split('/')
        .filter(Boolean)
        .pop();

    if (lastPart) {
      return decodeURIComponent(
        lastPart,
      );
    }

    return parsed.hostname;
  } catch {
    return 'fonte-de-inteligencia';
  }
}

export async function GET() {
  const user =
    await requireApiUser();

  if (!user) {
    return NextResponse.json(
      {
        error: 'Não autorizado',
      },
      {
        status: 401,
      },
    );
  }

  const data =
    await db.bookIngestion.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

  return NextResponse.json({
    data,
  });
}

export async function POST(
  req: Request,
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

  try {
    const body =
      await req.json();

    const storageUrl =
      String(
        body.storageUrl ??
          body.url ??
          '',
      ).trim();

    if (!storageUrl) {
      return NextResponse.json(
        {
          error:
            'Informe a URL da fonte.',
        },
        {
          status: 400,
        },
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(
        storageUrl,
      );
    } catch {
      return NextResponse.json(
        {
          error:
            'URL inválida.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      ![
        'http:',
        'https:',
      ].includes(
        parsedUrl.protocol,
      )
    ) {
      return NextResponse.json(
        {
          error:
            'A fonte precisa usar HTTP ou HTTPS.',
        },
        {
          status: 400,
        },
      );
    }

    const projectId =
      body.projectId
        ? String(
            body.projectId,
          ).trim()
        : null;

    if (projectId) {
      const project =
        await db.project.findUnique({
          where: {
            id: projectId,
          },

          select: {
            id: true,
          },
        });

      if (!project) {
        return NextResponse.json(
          {
            error:
              'Empreendimento não encontrado.',
          },
          {
            status: 404,
          },
        );
      }
    }

    const fileName =
      inferFileName(
        storageUrl,
        body.fileName,
      );

    const mimeType =
      inferMimeType(
        storageUrl,
        body.mimeType,
      );

    const book =
      await db.bookIngestion.create({
        data: {
          fileName,
          storageUrl,
          mimeType,
          projectId,
          status: 'UPLOADED',
          progress: 0,
        },
      });

    await audit(
      'CREATE',
      'BookIngestion',
      book.id,
      auth.user.id,
      {
        fileName:
          book.fileName,
        storageUrl:
          book.storageUrl,
      },
    );

    const result =
      await processBookContent({
        fileName:
          book.fileName,

        storageUrl:
          book.storageUrl,

        mimeType:
          book.mimeType,

        extracted:
          book.extracted,
      });

    if (!result.ok) {
      const updated =
        await db.bookIngestion.update({
          where: {
            id: book.id,
          },

          data: {
            status: 'FAILED',
            progress: 100,
            error:
              result.message,
          },
        });

      return NextResponse.json(
        {
          ok: false,
          book: updated,
          message:
            result.message,
          characterCount:
            result.characterCount,
        },
        {
          status: 201,
        },
      );
    }

    const completed =
      await db.bookIngestion.update({
        where: {
          id: book.id,
        },

        data: {
          status: 'COMPLETED',
          progress: 100,
          error: null,

          extracted: {
            text: result.text,

            characterCount:
              result.characterCount,

            source:
              result.source,

            mimeType:
              result.mimeType,

            processedAt:
              new Date()
                .toISOString(),
          },
        },
      });

    return NextResponse.json(
      {
        ok: true,
        book: completed,
        message:
          'Fonte cadastrada e processada.',
        characterCount:
          result.characterCount,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      'Erro ao cadastrar fonte:',
      error,
    );

    return NextResponse.json(
      {
        error:
          'Não foi possível cadastrar a fonte.',
      },
      {
        status: 500,
      },
    );
  }
}
