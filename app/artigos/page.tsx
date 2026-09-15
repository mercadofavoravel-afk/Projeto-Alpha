import type { Metadata } from 'next';
import Link from 'next/link';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { db } from '@/lib/db';
import { createMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createMetadata({
  title: 'Conteúdos e guias imobiliários do Rio de Janeiro',
  description:
    'Guias para morar, investir e acompanhar empreendimentos de alto padrão no Rio de Janeiro.',
  path: '/artigos',
});

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

export default async function ArticlesPage() {
  const articles = await db.article.findMany({
    where: {
      publishStatus: 'PUBLISHED',
    },
    orderBy: [
      {
        publishedAt: 'desc',
      },
      {
        updatedAt: 'desc',
      },
    ],
  });

  return (
    <>
      <Header />

      <main className="articles-page">
        <section className="articles-hero">
          <div className="wrap">
            <span className="eyebrow">Conteúdo imobiliário</span>
            <h1>Informação para escolher melhor no Rio.</h1>
            <p>
              Análises de bairros, empreendimentos e estratégias para quem quer morar,
              investir ou preservar patrimônio no Rio de Janeiro.
            </p>
          </div>
        </section>

        <section className="articles-list">
          <div className="wrap">
            {articles.length > 0 ? (
              <div className="articles-grid">
                {articles.map((article) => (
                  <article className="article-card" key={article.id}>
                    {article.heroImage ? (
                      <img src={article.heroImage} alt="" />
                    ) : (
                      <div className="article-card-placeholder" />
                    )}

                    <div className="article-card-content">
                      <div className="article-card-meta">
                        <span>{article.category || 'Guia imobiliário'}</span>
                        {formatDate(article.publishedAt) && (
                          <time dateTime={article.publishedAt?.toISOString()}>
                            {formatDate(article.publishedAt)}
                          </time>
                        )}
                      </div>

                      <h2>
                        <Link href={`/artigos/${article.slug}`}>
                          {article.title}
                        </Link>
                      </h2>

                      <p>
                        {article.excerpt ||
                          'Leia a análise preparada pela Imóveis de Alto Padrão Rio.'}
                      </p>

                      <Link className="article-card-link" href={`/artigos/${article.slug}`}>
                        Ler conteúdo
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="articles-empty">
                Novos guias e análises estão sendo preparados pela nossa curadoria.
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .articles-page { background: #f4f1eb; color: #172228; min-height: 70vh; }
        .articles-hero { background: #101a1f; color: #fff; padding: 130px 0 86px; }
        .articles-hero .eyebrow { color: #b5976c; }
        .articles-hero h1 { max-width: 800px; margin: 16px 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(44px, 7vw, 78px); font-weight: 400; line-height: 1; letter-spacing: -.04em; }
        .articles-hero p { max-width: 620px; color: rgba(255,255,255,.76); font-size: 18px; line-height: 1.75; }
        .articles-list { padding: 80px 0 110px; }
        .articles-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
        .article-card { background: #fff; overflow: hidden; }
        .article-card img, .article-card-placeholder { width: 100%; height: 230px; display: block; object-fit: cover; background: linear-gradient(140deg, #203138, #a58861); }
        .article-card-content { padding: 28px; }
        .article-card-meta { display: flex; justify-content: space-between; gap: 12px; color: #8b7254; font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
        .article-card-meta time { color: #788286; letter-spacing: 0; text-transform: none; }
        .article-card h2 { margin: 18px 0 12px; font-family: Georgia, 'Times New Roman', serif; font-size: 30px; font-weight: 400; line-height: 1.08; }
        .article-card h2 a { color: inherit; text-decoration: none; }
        .article-card p { min-height: 70px; margin: 0 0 22px; color: #667177; line-height: 1.7; }
        .article-card-link { color: #172228; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-decoration: none; text-transform: uppercase; }
        .articles-empty { padding: 64px; border: 1px solid #d7d0c7; text-align: center; color: #667177; }
        @media (max-width: 900px) { .articles-grid { grid-template-columns: 1fr; } .articles-hero { padding: 104px 0 66px; } }
      `}</style>
    </>
  );
}
