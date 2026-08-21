import Link from 'next/link';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type HighlightItem = {
  title: string;
  description?: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

function highlightsToText(value: unknown) {
  if (!Array.isArray(value)) return '';

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (
        typeof item === 'object' &&
        item !== null &&
        'title' in item &&
        typeof item.title === 'string'
      ) {
        const description =
          'description' in item &&
          typeof item.description === 'string'
            ? item.description
            : '';

        return description
          ? `${item.title} | ${description}`
          : item.title;
      }

      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function faqToText(value: unknown) {
  if (!Array.isArray(value)) return '';

  return value
    .map((item) => {
      if (
        typeof item === 'object' &&
        item !== null &&
        'question' in item &&
        'answer' in item &&
        typeof item.question === 'string' &&
        typeof item.answer === 'string'
      ) {
        return `${item.question} | ${item.answer}`;
      }

      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function parseHighlights(
  value: string,
): HighlightItem[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...descriptionParts] =
        line.split('|');

      const description = descriptionParts
        .join('|')
        .trim();

      return {
        title: title.trim(),
        ...(description
          ? { description }
          : {}),
      };
    })
    .filter(
      (item) => item.title.length > 0,
    );
}

function parseFaq(value: string): FaqItem[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question, ...answerParts] =
        line.split('|');

      return {
        question: question.trim(),
        answer: answerParts
          .join('|')
          .trim(),
      };
    })
    .filter(
      (item) =>
        item.question.length > 0 &&
        item.answer.length > 0,
    );
}

function optionalString(
  formData: FormData,
  field: string,
) {
  const value = String(
    formData.get(field) ?? '',
  ).trim();

  return value || null;
}

async function updateNeighborhoodAction(
  formData: FormData,
) {
  'use server';

  await requirePermission(
    'catalog:write',
  );

  const id = String(
    formData.get('id') ?? '',
  );

  const slug = String(
    formData.get('slug') ?? '',
  ).trim();

  const name = String(
    formData.get('name') ?? '',
  ).trim();

  if (!id || !slug || !name) {
    throw new Error(
      'ID, nome e slug são obrigatórios.',
    );
  }

  const highlights = parseHighlights(
    String(
      formData.get('highlights') ?? '',
    ),
  );

  const faq = parseFaq(
    String(formData.get('faq') ?? ''),
  );

  await db.neighborhood.update({
    where: {
      id,
    },

    data: {
      name,
      slug,

      heroImage: optionalString(
        formData,
        'heroImage',
      ),

      description: optionalString(
        formData,
        'description',
      ),

      experienceTitle: optionalString(
        formData,
        'experienceTitle',
      ),

      experienceDescription:
        optionalString(
          formData,
          'experienceDescription',
        ),

      highlights:
        highlights.length > 0
          ? highlights
          : undefined,

      videoUrl: optionalString(
        formData,
        'videoUrl',
      ),

      videoTitle: optionalString(
        formData,
        'videoTitle',
      ),

      ctaTitle: optionalString(
        formData,
        'ctaTitle',
      ),

      ctaDescription: optionalString(
        formData,
        'ctaDescription',
      ),

      faq:
        faq.length > 0
          ? faq
          : undefined,

      seoTitle: optionalString(
        formData,
        'seoTitle',
      ),

      seoDescription: optionalString(
        formData,
        'seoDescription',
      ),
    },
  });

  revalidatePath(
    '/admin/bairros',
  );

  revalidatePath(
    `/admin/bairros/${id}`,
  );

  revalidatePath('/bairros');

  revalidatePath(
    `/bairros/${slug}`,
  );
}

export default async function NeighborhoodEditorPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  await requirePermission(
    'catalog:write',
  );

  const { id } = await params;

  const neighborhood =
    await db.neighborhood.findUnique({
      where: {
        id,
      },

      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

  if (!neighborhood) {
    notFound();
  }

  const highlightsText =
    highlightsToText(
      neighborhood.highlights,
    );

  const faqText = faqToText(
    neighborhood.faq,
  );

  return (
    <>
      <div className="eyebrow">
        Inteligência territorial
      </div>

      <div className="head">
        <div>
          <h1>
            {neighborhood.name}
          </h1>

          <p>
            Construa a experiência
            editorial, comercial e de SEO
            desta localização.
          </p>
        </div>

        <div>
          {
            neighborhood._count
              .projects
          }{' '}
          empreendimentos vinculados
        </div>
      </div>

      <p>
        <Link href="/admin/bairros">
          ← Voltar aos bairros
        </Link>
      </p>

      <form
        action={
          updateNeighborhoodAction
        }
        className="editor-form"
      >
        <input
          type="hidden"
          name="id"
          value={neighborhood.id}
        />

        <section className="admin-card">
          <div className="eyebrow">
            Identidade
          </div>

          <h2>
            Informações principais
          </h2>

          <div className="editor-grid">
            <label>
              Nome do bairro

              <input
                name="name"
                defaultValue={
                  neighborhood.name
                }
                required
              />
            </label>

            <label>
              Slug

              <input
                name="slug"
                defaultValue={
                  neighborhood.slug
                }
                required
              />
            </label>

            <label className="editor-wide">
              Imagem principal

              <input
                name="heroImage"
                defaultValue={
                  neighborhood.heroImage ??
                  ''
                }
                placeholder="/images/leblon.webp ou URL autorizada"
              />
            </label>

            <label className="editor-wide">
              Descrição principal

              <textarea
                name="description"
                rows={6}
                defaultValue={
                  neighborhood.description ??
                  ''
                }
                placeholder="Introdução editorial sobre o bairro."
              />
            </label>
          </div>
        </section>

        <section className="admin-card">
          <div className="eyebrow">
            Lifestyle
          </div>

          <h2>
            Como é viver aqui
          </h2>

          <div className="editor-grid">
            <label className="editor-wide">
              Título da experiência

              <input
                name="experienceTitle"
                defaultValue={
                  neighborhood.experienceTitle ??
                  ''
                }
                placeholder={`Como é viver em ${neighborhood.name}`}
              />
            </label>

            <label className="editor-wide">
              Experiência do bairro

              <textarea
                name="experienceDescription"
                rows={9}
                defaultValue={
                  neighborhood.experienceDescription ??
                  ''
                }
                placeholder="Descreva rotina, lifestyle, mobilidade, gastronomia, praia, serviços e perfil de quem procura a região."
              />
            </label>
          </div>
        </section>

        <section className="admin-card">
          <div className="eyebrow">
            Diferenciais
          </div>

          <h2>
            Pontos positivos do bairro
          </h2>

          <p>
            Use uma linha para cada
            destaque. Escreva o título,
            depois <b>|</b>, depois a
            descrição.
          </p>

          <textarea
            name="highlights"
            rows={10}
            defaultValue={
              highlightsText
            }
            placeholder={`Praia e orla | Acesso a uma das experiências costeiras mais desejadas do Rio.
Gastronomia | Restaurantes, cafés e serviços de alto nível próximos de casa.
Mobilidade | Conexão conveniente com outras regiões estratégicas da cidade.`}
          />
        </section>

        <section className="admin-card">
          <div className="eyebrow">
            Conteúdo audiovisual
          </div>

          <h2>
            Vídeo do bairro
          </h2>

          <div className="editor-grid">
            <label className="editor-wide">
              URL do vídeo

              <input
                name="videoUrl"
                defaultValue={
                  neighborhood.videoUrl ??
                  ''
                }
                placeholder="YouTube, Vimeo ou arquivo autorizado"
              />
            </label>

            <label className="editor-wide">
              Título do vídeo

              <input
                name="videoTitle"
                defaultValue={
                  neighborhood.videoTitle ??
                  ''
                }
                placeholder={`Conheça ${neighborhood.name}`}
              />
            </label>
          </div>
        </section>

        <section className="admin-card">
          <div className="eyebrow">
            Conversão
          </div>

          <h2>
            Chamada comercial
          </h2>

          <div className="editor-grid">
            <label className="editor-wide">
              Título da chamada

              <input
                name="ctaTitle"
                defaultValue={
                  neighborhood.ctaTitle ??
                  ''
                }
                placeholder={`Encontre o imóvel certo em ${neighborhood.name}.`}
              />
            </label>

            <label className="editor-wide">
              Texto da chamada

              <textarea
                name="ctaDescription"
                rows={5}
                defaultValue={
                  neighborhood.ctaDescription ??
                  ''
                }
                placeholder="Explique por que o cliente deve solicitar uma curadoria personalizada."
              />
            </label>
          </div>
        </section>

        <section className="admin-card">
          <div className="eyebrow">
            SEO e intenção de busca
          </div>

          <h2>
            Perguntas frequentes
          </h2>

          <p>
            Uma pergunta por linha. Use{' '}
            <b>|</b> entre a pergunta e a
            resposta.
          </p>

          <textarea
            name="faq"
            rows={12}
            defaultValue={faqText}
            placeholder={`Como é morar em ${neighborhood.name}? | Resposta editorial original e útil para quem está pesquisando a região.
Quais tipos de imóveis existem em ${neighborhood.name}? | Explique as tipologias e o perfil predominante da oferta.`}
          />
        </section>

        <section className="admin-card">
          <div className="eyebrow">
            Google
          </div>

          <h2>
            SEO da página
          </h2>

          <div className="editor-grid">
            <label className="editor-wide">
              Título SEO

              <input
                name="seoTitle"
                maxLength={70}
                defaultValue={
                  neighborhood.seoTitle ??
                  ''
                }
                placeholder={`Imóveis de alto padrão em ${neighborhood.name}`}
              />
            </label>

            <label className="editor-wide">
              Descrição SEO

              <textarea
                name="seoDescription"
                maxLength={180}
                rows={4}
                defaultValue={
                  neighborhood.seoDescription ??
                  ''
                }
                placeholder={`Conheça imóveis, lançamentos e a experiência de viver em ${neighborhood.name}, Rio de Janeiro.`}
              />
            </label>
          </div>
        </section>

        <div className="editor-save">
          <button
            className="btn"
            type="submit"
          >
            Salvar bairro
          </button>

          <Link
            href={`/bairros/${neighborhood.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            Ver página pública →
          </Link>
        </div>
      </form>

      <style>{`
        .editor-form {
          display: grid;
          gap: 24px;
          margin-top: 32px;
        }

        .admin-card {
          background: #fff;
          border: 1px solid #ded8cf;
          padding: 32px;
        }

        .admin-card h2 {
          margin-top: 0;
        }

        .editor-grid {
          display: grid;
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          );
          gap: 22px;
        }

        .editor-grid label,
        .admin-card > textarea {
          display: grid;
          gap: 8px;
        }

        .editor-wide {
          grid-column: 1 / -1;
        }

        .editor-form input,
        .editor-form textarea {
          width: 100%;
          box-sizing: border-box;
        }

        .editor-save {
          position: sticky;
          bottom: 18px;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 24px;
          padding: 18px 22px;
          background: #142026;
          color: #fff;
          box-shadow:
            0 16px 50px
            rgba(0, 0, 0, .16);
        }

        .editor-save a {
          color: #fff;
        }

        @media (max-width: 800px) {
          .editor-grid {
            grid-template-columns: 1fr;
          }

          .editor-wide {
            grid-column: auto;
          }

          .admin-card {
            padding: 22px;
          }

          .editor-save {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </>
  );
}
