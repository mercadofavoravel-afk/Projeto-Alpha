import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { processBookContent } from '@/lib/book-processor';

export const dynamic = 'force-dynamic';

function inferMimeType(url: string) {
  const clean = url
    .toLocaleLowerCase('pt-BR')
    .split('?')[0];

  if (clean.endsWith('.pdf')) {
    return 'application/pdf';
  }

  if (clean.endsWith('.json')) {
    return 'application/json';
  }

  if (
    clean.endsWith('.txt') ||
    clean.endsWith('.md')
  ) {
    return 'text/plain';
  }

  return 'text/html';
}

function inferFileName(url: string) {
  try {
    const parsed = new URL(url);

    const lastPart =
      parsed.pathname
        .split('/')
        .filter(Boolean)
        .pop();

    return lastPart
      ? decodeURIComponent(lastPart)
      : parsed.hostname;
  } catch {
    return 'fonte-de-inteligencia';
  }
}

async function addSourceAction(
  formData: FormData,
) {
  'use server';

  await requirePermission(
    'media:write',
  );

  const storageUrl = String(
    formData.get('storageUrl') ?? '',
  ).trim();

  const projectIdValue = String(
    formData.get('projectId') ?? '',
  ).trim();

  const projectId =
    projectIdValue || null;

  if (!storageUrl) {
    throw new Error(
      'Informe a URL da fonte.',
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(
      storageUrl,
    );
  } catch {
    throw new Error(
      'A URL informada é inválida.',
    );
  }

  if (
    ![
      'http:',
      'https:',
    ].includes(parsedUrl.protocol)
  ) {
    throw new Error(
      'A fonte precisa usar HTTP ou HTTPS.',
    );
  }

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
      throw new Error(
        'Empreendimento não encontrado.',
      );
    }
  }

  const fileName =
    inferFileName(storageUrl);

  const mimeType =
    inferMimeType(storageUrl);

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

    revalidatePath(
      '/admin/books',
    );

    return;
  }

  await db.bookIngestion.update({
    where: {
      id: book.id,
    },

    data: {
      status: 'COMPLETED',
      progress: 100,
      error: null,

      extracted: {
        text:
          result.text,

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

  revalidatePath(
    '/admin/books',
  );
}

export default async function BooksPage() {
  await requirePermission(
    'media:write',
  );

  const [books, projects] =
    await Promise.all([
      db.bookIngestion.findMany({
        include: {
          project: {
            select: {
              name: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      }),

      db.project.findMany({
        where: {
          publishStatus:
            'PUBLISHED',
        },

        select: {
          id: true,
          name: true,
          neighborhood: {
            select: {
              name: true,
            },
          },
        },

        orderBy: {
          name: 'asc',
        },
      }),
    ]);

  return (
    <>
      <div className="eyebrow">
        Ingestão documental
      </div>

      <h1>Books</h1>

      <div className="notice">
        Cadastre fontes de inteligência
        para que o Alpha possa processar
        informações e reutilizá-las em
        empreendimentos, bairros, busca
        e SEO.
      </div>

      <section className="source-card">
        <div>
          <div className="eyebrow">
            Inteligência de mercado
          </div>

          <h2>
            Adicionar fonte
          </h2>

          <p>
            Informe um link de material,
            página oficial, documento ou
            outra fonte autorizada.
          </p>
        </div>

        <form
          action={addSourceAction}
          className="source-form"
        >
          <label>
            URL da fonte

            <input
              type="url"
              name="storageUrl"
              required
              placeholder="https://..."
            />
          </label>

          <label>
            Empreendimento relacionado

            <select
              name="projectId"
              defaultValue=""
            >
              <option value="">
                Fonte geral / não associada
              </option>

              {projects.map(
                (project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                    {' · '}
                    {
                      project
                        .neighborhood
                        .name
                    }
                  </option>
                ),
              )}
            </select>
          </label>

          <button
            type="submit"
            className="source-button"
          >
            Adicionar e processar
          </button>
        </form>
      </section>

      <section className="books-section">
        <div className="books-head">
          <div>
            <div className="eyebrow">
              Base documental
            </div>

            <h2>
              Fontes cadastradas
            </h2>
          </div>

          <strong>
            {books.length}{' '}
            {books.length === 1
              ? 'fonte'
              : 'fontes'}
          </strong>
        </div>

        {books.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Arquivo / fonte</th>
                  <th>
                    Empreendimento
                  </th>
                  <th>Status</th>
                  <th>Progresso</th>
                  <th>Resultado</th>
                </tr>
              </thead>

              <tbody>
                {books.map(
                  (book) => (
                    <tr key={book.id}>
                      <td>
                        <strong>
                          {book.fileName}
                        </strong>

                        <small>
                          {
                            book.storageUrl
                          }
                        </small>
                      </td>

                      <td>
                        {book.project
                          ?.name ??
                          'Fonte geral'}
                      </td>

                      <td>
                        <span
                          className={`status status-${book.status.toLowerCase()}`}
                        >
                          {
                            book.status
                          }
                        </span>
                      </td>

                      <td>
                        {
                          book.progress
                        }
                        %
                      </td>

                      <td>
                        {book.error ? (
                          <span className="error-text">
                            {
                              book.error
                            }
                          </span>
                        ) : book.status ===
                          'COMPLETED' ? (
                          <span className="success-text">
                            Conteúdo
                            disponível
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="books-empty">
            <div className="eyebrow">
              Base vazia
            </div>

            <h3>
              Nenhuma fonte cadastrada
              ainda.
            </h3>

            <p>
              Use o formulário acima
              para iniciar a base de
              inteligência do Alpha.
            </p>
          </div>
        )}
      </section>

      <style>{`
        .source-card {
          margin-top: 32px;
          padding: 32px;
          background: #111d22;
          color: #fff;
          display: grid;
          grid-template-columns:
            .8fr 1.2fr;
          gap: 54px;
          align-items: start;
        }

        .source-card h2,
        .books-head h2 {
          margin: 0 0 12px;
          font-family:
            Georgia,
            'Times New Roman',
            serif;
          font-size: 34px;
          font-weight: 400;
        }

        .source-card p {
          color:
            rgba(
              255,
              255,
              255,
              .64
            );
          line-height: 1.7;
        }

        .source-form {
          display: grid;
          gap: 18px;
        }

        .source-form label {
          display: grid;
          gap: 8px;
          font-size: 11px;
          text-transform:
            uppercase;
          letter-spacing: .1em;
        }

        .source-form input,
        .source-form select {
          min-height: 48px;
          padding: 0 12px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .22
            );
          background:
            rgba(
              255,
              255,
              255,
              .05
            );
          color: #fff;
        }

        .source-form option {
          color: #111;
        }

        .source-button {
          min-height: 54px;
          border: 0;
          cursor: pointer;
          background: #b5986e;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          text-transform:
            uppercase;
          letter-spacing: .12em;
        }

        .books-section {
          margin-top: 32px;
          padding: 30px;
          background: #fff;
          border:
            1px solid #ded8cf;
        }

        .books-head {
          display: flex;
          justify-content:
            space-between;
          align-items: end;
          gap: 30px;
          margin-bottom: 28px;
        }

        .books-head strong {
          font-size: 12px;
          text-transform:
            uppercase;
          letter-spacing: .1em;
          color: #887152;
        }

        .table small {
          display: block;
          max-width: 360px;
          margin-top: 5px;
          color: #7a8387;
          word-break: break-all;
        }

        .status {
          display:
            inline-flex;
          padding: 6px 8px;
          font-size: 9px;
          letter-spacing: .1em;
          text-transform:
            uppercase;
          border:
            1px solid #d8d1c7;
        }

        .status-completed {
          color: #1d633b;
          border-color: #b8d8c4;
          background: #eff8f2;
        }

        .status-failed {
          color: #8a372e;
          border-color: #e2c0bb;
          background: #fff2f0;
        }

        .success-text {
          color: #1d633b;
        }

        .error-text {
          color: #8a372e;
          font-size: 12px;
        }

        .books-empty {
          padding: 50px 24px;
          text-align: center;
          border:
            1px dashed #d2cabf;
        }

        .books-empty h3 {
          font-family:
            Georgia,
            'Times New Roman',
            serif;
          font-size: 28px;
          font-weight: 400;
          margin:
            10px 0;
        }

        @media (
          max-width: 800px
        ) {
          .source-card {
            grid-template-columns:
              1fr;
            gap: 28px;
            padding: 24px;
          }

          .books-head {
            align-items:
              flex-start;
            flex-direction:
              column;
          }
        }
      `}</style>
    </>
  );
}
