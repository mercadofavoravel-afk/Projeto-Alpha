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
      </main>

      <Footer />
    </>
  );
}
