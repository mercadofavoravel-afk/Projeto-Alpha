import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { db } from '@/lib/db';
import { createMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = createMetadata({
  title: 'Bairros do Rio de Janeiro',
  description:
    'Explore bairros selecionados do Rio de Janeiro e conheça os empreendimentos de alto padrão disponíveis em cada região.',
  path: '/bairros',
  keywords: [
    'bairros Rio de Janeiro',
    'imóveis de luxo Rio de Janeiro',
    'apartamentos alto padrão Rio',
    'empreendimentos Rio de Janeiro',
  ],
});

export default async function BairrosPage() {
  const neighborhoods = await db.neighborhood.findMany({
    where: {
      projects: {
        some: {
          publishStatus: 'PUBLISHED',
        },
      },
    },
    include: {
      projects: {
        where: {
          publishStatus: 'PUBLISHED',
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <>
      <Header />

      <main>
        <section className="projects-hero">
          <div className="wrap projects-hero-grid">
            <div>
              <div className="eyebrow">
                Inteligência local
              </div>

              <h1>
                Os endereços que definem diferentes formas
                de viver o Rio.
              </h1>
            </div>

            <div className="projects-hero-copy">
              <p>
                Explore os bairros da nossa curadoria e
                descubra os empreendimentos disponíveis em
                cada região.
              </p>

              <span>
                {neighborhoods.length}{' '}
                {neighborhoods.length === 1
                  ? 'bairro selecionado'
                  : 'bairros selecionados'}
              </span>
            </div>
          </div>
        </section>

        <section className="projects-section">
          <div className="wrap">
            <div className="projects-intro">
              <div>
                <div className="eyebrow">
                  Rio de Janeiro
                </div>

                <h2>
                  Conheça o mercado por localização.
                </h2>
              </div>

              <p>
                Cada bairro reúne uma seleção própria de
                empreendimentos e características que
                ajudam a entender melhor cada endereço.
              </p>
            </div>

            {neighborhoods.length > 0 ? (
              <div className="grid projects-grid">
                {neighborhoods.map((neighborhood) => (
                  <Link
                    key={neighborhood.id}
                    href={`/bairros/${neighborhood.slug}`}
                    className="card"
                  >
                    <div className="card-body">
                      <div className="eyebrow">
                        Bairro
                      </div>

                      <h2>{neighborhood.name}</h2>

                      <p>
                        {neighborhood.projects.length}{' '}
                        {neighborhood.projects.length === 1
                          ? 'empreendimento publicado'
                          : 'empreendimentos publicados'}
                      </p>

                      <span>
                        Explorar {neighborhood.name} →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="notice">
                Nenhum bairro com empreendimentos
                publicados no momento.
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
