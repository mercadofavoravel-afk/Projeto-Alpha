import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { LeadCaptureForm } from '@/app/empreendimentos/[slug]/LeadCaptureForm';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { db } from '@/lib/db';
import { createMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

async function getArticle(slug: string) {
  return db.article.findFirst({
    where: {
      slug,
      publishStatus: 'PUBLISHED',
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return createMetadata({
      title: 'Conteúdo não encontrado',
      description: 'O conteúdo solicitado não está disponível.',
      path: `/artigos/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: article.seoTitle || article.title,
    description:
      article.seoDescription ||
      article.excerpt ||
      'Conteúdo imobiliário da Imóveis de Alto Padrão Rio.',
    path: `/artigos/${article.slug}`,
    image: article.heroImage || '/images/og-default.webp',
    imageAlt: article.title,
    type: 'article',
  });
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const [relatedArticles, featuredProjects] = await Promise.all([
    db.article.findMany({
      where: {
        publishStatus: 'PUBLISHED',
        id: {
          not: article.id,
        },
        ...(article.category
          ? {
              category: article.category,
            }
          : {}),
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 3,
    }),
    db.project.findMany({
      where: {
        publishStatus: 'PUBLISHED',
      },
      include: {
        neighborhood: true,
      },
      orderBy: [
        {
          featured: 'desc',
        },
        {
          updatedAt: 'desc',
        },
      ],
      take: 3,
    }),
  ]);

  const neighborhoods = Array.from(
    new Map(
      featuredProjects.map((project) => [project.neighborhood.slug, project.neighborhood]),
    ).values(),
  ).slice(0, 3);

  const paragraphs = article.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <>
      <Header />

      <main>
        <section className="collections-hero">
          <div className="wrap collections-hero-grid">
            <div>
              <Link className="collection-link" href="/artigos">
                ← Todos os conteúdos
              </Link>

              <div className="eyebrow">{article.category || 'Guia imobiliário'}</div>

              <h1>{article.title}</h1>
            </div>

            <div className="collections-hero-copy">
              {article.excerpt && <p>{article.excerpt}</p>}

              {formatDate(article.publishedAt) && <p>{formatDate(article.publishedAt)}</p>}
            </div>
          </div>
        </section>

        <article className="collections-section">
          <div className="wrap">
            {article.heroImage && <img src={article.heroImage} alt={article.title} />}

            <div className="collection-card-content">
              {paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
              ))}
            </div>
          </div>
        </article>

        <section className="article-related">
          <div className="wrap">
            <div className="article-related-head">
              <div>
                <div className="eyebrow">Continue sua pesquisa</div>

                <h2>Conteúdo, localização e oportunidades no mesmo lugar.</h2>
              </div>

              <p>
                Explore outras referências da Imóveis de Alto Padrão Rio e avance para uma conversa
                orientada ao seu perfil.
              </p>
            </div>

            <div className="article-related-grid">
              <div className="article-related-group">
                <div className="eyebrow">Mais conteúdos</div>

                {relatedArticles.length > 0 ? (
                  relatedArticles.map((relatedArticle) => (
                    <Link
                      className="article-related-link"
                      href={`/artigos/${relatedArticle.slug}`}
                      key={relatedArticle.id}
                    >
                      <span>{relatedArticle.category || 'Guia imobiliário'}</span>
                      <strong>{relatedArticle.title}</strong>
                      <small>Continuar lendo →</small>
                    </Link>
                  ))
                ) : (
                  <Link className="article-related-link" href="/artigos">
                    <span>Conteúdos da curadoria</span>
                    <strong>Explore os nossos guias imobiliários.</strong>
                    <small>Ver todos os conteúdos →</small>
                  </Link>
                )}
              </div>

              <div className="article-related-group">
                <div className="eyebrow">Empreendimentos publicados</div>

                {featuredProjects.length > 0 ? (
                  featuredProjects.map((project) => (
                    <Link
                      className="article-related-link"
                      href={`/empreendimentos/${project.slug}`}
                      key={project.id}
                    >
                      <span>{project.neighborhood.name} · Rio de Janeiro</span>
                      <strong>{project.name}</strong>
                      <small>Conhecer empreendimento →</small>
                    </Link>
                  ))
                ) : (
                  <Link className="article-related-link" href="/empreendimentos">
                    <span>Portfólio selecionado</span>
                    <strong>Conheça os empreendimentos da nossa curadoria.</strong>
                    <small>Ver empreendimentos →</small>
                  </Link>
                )}
              </div>

              <div className="article-related-group">
                <div className="eyebrow">Por localização</div>

                {neighborhoods.length > 0 ? (
                  neighborhoods.map((neighborhood) => (
                    <Link
                      className="article-related-link"
                      href={`/bairros/${neighborhood.slug}`}
                      key={neighborhood.slug}
                    >
                      <span>Inteligência local</span>
                      <strong>Conheça {neighborhood.name}.</strong>
                      <small>Explorar bairro →</small>
                    </Link>
                  ))
                ) : (
                  <Link className="article-related-link" href="/bairros">
                    <span>Inteligência local</span>
                    <strong>Explore os bairros da nossa curadoria.</strong>
                    <small>Ver bairros →</small>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="collections-section" id="atendimento">
          <div className="wrap collections-hero-grid">
            <div>
              <div className="eyebrow">Atendimento reservado</div>

              <h2>Receba oportunidades alinhadas ao que você procura.</h2>

              <p>
                Fale agora com um especialista da Imóveis de Alto Padrão e receba todo o material em
                primeira mão.
              </p>
            </div>

            <LeadCaptureForm
              neighborhood="Rio de Janeiro"
              projectName={`Conteúdo: ${article.title}`}
              projectSlug={`artigo-${article.slug}`}
            />
          </div>
        </section>
        <style>{`
          .article-related {
            padding: 95px 0 110px;
            background: #f4efe6;
          }

          .article-related-head {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 90px;
            align-items: end;
            margin-bottom: 52px;
          }

          .article-related-head h2 {
            max-width: 760px;
            margin: 14px 0 0;
            font: 500 clamp(2.5rem, 4vw, 4.2rem) / 1 Georgia, serif;
            letter-spacing: -0.035em;
          }

          .article-related-head > p {
            margin: 0;
            color: var(--m);
            line-height: 1.75;
          }

          .article-related-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }

          .article-related-group {
            min-height: 100%;
            padding: 30px;
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(22, 34, 29, 0.1);
          }

          .article-related-link {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 22px 0;
            border-bottom: 1px solid rgba(22, 34, 29, 0.12);
          }

          .article-related-link:last-child {
            border-bottom: 0;
          }

          .article-related-link span,
          .article-related-link small {
            color: #887550;
            font-size: 0.63rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          .article-related-link strong {
            font: 500 1.35rem / 1.25 Georgia, serif;
          }

          .article-related-link:hover strong {
            color: #8a7548;
          }

          @media (max-width: 900px) {
            .article-related-head,
            .article-related-grid {
              grid-template-columns: 1fr;
              gap: 38px;
            }
          }

          @media (max-width: 620px) {
            .article-related {
              padding: 65px 0 80px;
            }

            .article-related-group {
              padding: 24px 20px;
            }
          }
        `}</style>
      </main>

      <Footer />
    </>
  );
}
