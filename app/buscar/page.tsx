import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { db } from '@/lib/db';
import { createMetadata } from '@/lib/seo';
import { Search, type SearchProject } from './Search';

export const dynamic = 'force-dynamic';

export const metadata = createMetadata({
  title: 'Buscar imóveis de alto padrão no Rio de Janeiro',
  description:
    'Explore uma seleção de imóveis de alto padrão no Rio de Janeiro por empreendimento, bairro, tipologia e características.',
  path: '/buscar',
  keywords: [
    'buscar imóveis Rio de Janeiro',
    'imóveis de luxo RJ',
    'apartamentos alto padrão Rio',
  ],
});

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    bairro?: string;
  }>;
}) {
  const params = await searchParams;

  const initialQuery =
    typeof params.q === 'string' ? params.q : '';

  const initialNeighborhood =
    typeof params.bairro === 'string'
      ? params.bairro
      : '';

  const dbProjects = await db.project.findMany({
    where: {
      publishStatus: 'PUBLISHED',
    },
    include: {
      neighborhood: true,
      typologies: true,
      collections: {
        include: {
          collection: true,
        },
      },
      amenities: {
        include: {
          amenity: true,
        },
      },
      media: {
        orderBy: {
          position: 'asc',
        },
      },
    },
    orderBy: [
      {
        featured: 'desc',
      },
      {
        updatedAt: 'desc',
      },
    ],
  });

  const projects: SearchProject[] = dbProjects.map(
    (project) => ({
      slug: project.slug,
      name: project.name,
      description: project.description,
      neighborhood: project.neighborhood.name,
      image:
        project.heroImage ||
        project.media[0]?.url ||
        '/images/og-default.webp',
      status:
        project.statusLabel ||
        (project.publishStatus === 'PUBLISHED'
          ? 'Disponível'
          : project.publishStatus),
      objectives: [],
      types: project.typologies.map(
        (item) => item.name,
      ),
      collections: project.collections.map(
        (item) => item.collection.name,
      ),
      highlights: project.amenities.map(
        (item) => item.amenity.name,
      ),
    }),
  );

  return (
    <>
      <Header />

      <main>
        <section className="search-hero">
          <div className="wrap search-hero-grid">
            <div>
              <div className="eyebrow">
                Portfólio selecionado
              </div>

              <h1>
                Encontre um endereço à altura das suas
                escolhas.
              </h1>
            </div>

            <div className="search-hero-copy">
              <p>
                Explore nossa curadoria por
                empreendimento, bairro ou
                características relevantes para o seu
                estilo de vida.
              </p>

              <span>
                Uma seleção criteriosa nos endereços mais
                desejados do Rio.
              </span>
            </div>
          </div>
        </section>

        <section className="search-experience">
          <div className="wrap">
            <div className="search-intro">
              <div>
                <div className="eyebrow">
                  Explorar portfólio
                </div>

                <h2>Refine sua seleção.</h2>
              </div>

              <p>
                Comece por um endereço, empreendimento ou
                atributo. Os resultados são atualizados
                conforme suas escolhas.
              </p>
            </div>

            <div className="search-shell">
              <Search
                projects={projects}
                initialQuery={initialQuery}
                initialNeighborhood={
                  initialNeighborhood
                }
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
