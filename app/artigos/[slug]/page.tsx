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

      <main>
        <section className="collections-hero">
          <div className="wrap collections-hero-grid">
            <div>
              <div className="eyebrow">Conteúdo imobiliário</div>

              <h1>Informação para escolher melhor no Rio.</h1>
            </div>

            <div className="collections-hero-copy">
              <p>
                Análises de bairros, empreendimentos e estratégias para quem quer morar, investir ou
                preservar patrimônio no Rio de Janeiro.
              </p>

              <span>Conteúdo com curadoria da Imóveis de Alto Padrão Rio.</span>
            </div>
          </div>
        </section>

        <section className="collections-section">
          <div className="wrap">
            {articles.length > 0 ? (
              <div className="collections-grid">
                {articles.map((article) => (
                  <article className="collection-card" key={article.id}>
                    <div className="collection-card-content">
                      <div className="eyebrow">{article.category || 'Guia imobiliário'}</div>

                      <h2>{article.title}</h2>

                      {formatDate(article.publishedAt) && <p>{formatDate(article.publishedAt)}</p>}

                      <p>
                        {article.excerpt ||
                          'Leia a análise preparada pela Imóveis de Alto Padrão Rio.'}
                      </p>

                      <Link className="collection-link" href={`/artigos/${article.slug}`}>
                        Ler conteúdo
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bairro-empty">
                Novos guias e análises estão sendo preparados pela nossa curadoria.
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
