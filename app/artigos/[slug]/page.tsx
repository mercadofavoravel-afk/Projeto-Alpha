import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { LeadCaptureForm } from '@/app/empreendimentos/[slug]/LeadCaptureForm';
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

  const paragraphs = article.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <>
      <Header />

      <main className="article-page">
        <article>
          <header className="article-hero">
            <div className="wrap article-hero-inner">
              <Link className="article-back" href="/artigos">
                ← Todos os conteúdos
              </Link>

              <span className="eyebrow">{article.category || 'Guia imobiliário'}</span>
              <h1>{article.title}</h1>

              {article.excerpt && <p>{article.excerpt}</p>}

              {formatDate(article.publishedAt) && (
                <time dateTime={article.publishedAt?.toISOString()}>
                  {formatDate(article.publishedAt)}
                </time>
              )}
            </div>
          </header>

          {article.heroImage && (
            <div className="wrap article-image-wrap">
              <img className="article-image" src={article.heroImage} alt={article.title} />
            </div>
          )}

          <div className="wrap article-layout">
            <div className="article-content">
              {paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
              ))}
            </div>

            <aside className="article-cta">
              <span className="eyebrow">Curadoria própria</span>
              <h2>Quer entender as melhores opções para o seu perfil?</h2>
              <p>
                Fale agora com um especialista da Imóveis de Alto Padrão e receba todo
                o material em primeira mão.
              </p>
              <a href="#atendimento">Receber seleção personalizada</a>
            </aside>
          </div>
        </article>

        <section id="atendimento" className="article-lead">
          <div className="wrap article-lead-grid">
            <div>
              <span className="eyebrow">Atendimento reservado</span>
              <h2>Receba oportunidades alinhadas ao que você procura.</h2>
              <p>
                Informe seu objetivo e a faixa de investimento. Nossa equipe retorna
                com uma seleção adequada ao seu momento.
              </p>
            </div>

            <div className="article-form">
              <LeadCaptureForm
                projectName={`Conteúdo: ${article.title}`}
                projectSlug={`artigo-${article.slug}`}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .article-page { background: #f4f1eb; color: #172228; }
        .article-hero { background: #101a1f; color: #fff; padding: 112px 0 82px; }
        .article-hero-inner { max-width: 900px; }
        .article-back { display: inline-block; margin-bottom: 46px; color: rgba(255,255,255,.72); font-size: 12px; letter-spacing: .08em; text-decoration: none; }
        .article-hero .eyebrow, .article-lead .eyebrow { color: #b5976c; }
        .article-hero h1 { margin: 18px 0 24px; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(46px, 7vw, 80px); font-weight: 400; line-height: 1; letter-spacing: -.04em; }
        .article-hero p { max-width: 700px; color: rgba(255,255,255,.76); font-size: 20px; line-height: 1.65; }
        .article-hero time { display: block; margin-top: 26px; color: rgba(255,255,255,.56); font-size: 13px; }
        .article-image-wrap { margin-top: 48px; }
        .article-image { width: 100%; max-height: 610px; object-fit: cover; display: block; }
        .article-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 80px; padding: 80px 0 100px; }
        .article-content { max-width: 760px; }
        .article-content p { margin: 0 0 25px; color: #334046; font-size: 19px; line-height: 1.9; }
        .article-cta { align-self: start; padding: 30px; background: #fff; border-top: 3px solid #b5976c; }
        .article-cta h2, .article-lead h2 { margin: 14px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: 400; line-height: 1.1; }
        .article-cta p { color: #667177; line-height: 1.7; }
        .article-cta a { display: inline-flex; min-height: 48px; align-items: center; padding: 0 18px; background: #b5976c; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: .1em; text-decoration: none; text-transform: uppercase; }
        .article-lead { padding: 100px 0; background: #101a1f; color: #fff; }
        .article-lead-grid { display: grid; grid-template-columns: .9fr 1.1fr; gap: 90px; align-items: start; }
        .article-lead p { color: rgba(255,255,255,.68); font-size: 17px; line-height: 1.8; }
        .article-form { padding: 32px; background: #fff; color: #172228; }
        @media (max-width: 900px) { .article-layout, .article-lead-grid { grid-template-columns: 1fr; gap: 42px; } .article-hero { padding: 94px 0 64px; } .article-layout { padding: 58px 0 70px; } }
      `}</style>
    </>
  );
}
