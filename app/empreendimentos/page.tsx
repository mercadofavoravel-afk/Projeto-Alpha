import { Card } from '@/components/Card';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { db } from '@/lib/db';
import { createMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = createMetadata({
  title: 'Empreendimentos selecionados',
  description:
    'Conheça uma seleção de empreendimentos de alto padrão no Rio de Janeiro, escolhidos por localização, arquitetura e valor patrimonial.',
  path: '/empreendimentos',
});

export default async function Page() {
  const dbProjects = await db.project.findMany({
    where: {
      publishStatus: 'PUBLISHED',
    },
    include: {
      neighborhood: true,
      amenities: {
        include: {
          amenity: true,
        },
      },
      typologies: true,
      collections: {
        include: {
          collection: true,
        },
        orderBy: {
          position: 'asc',
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

  const projects = dbProjects.map((project) => ({
    slug: project.slug,
    name: project.name,
    neighborhood: project.neighborhood.name,
    description: project.description,
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
    types: project.typologies.map((item) => item.name),
    collections: project.collections.map(
      (item) => item.collection.name,
    ),
    highlights: project.amenities.map(
      (item) => item.amenity.name,
    ),
  }));

  return (
    <>
      <Header />

      <main>
        <section className="projects-hero">
          <div className="wrap projects-hero-grid">
            <div>
              <div className="eyebrow">
                Portfólio selecionado
              </div>

              <h1>
                Empreendimentos que traduzem diferentes
                formas de viver o Rio.
              </h1>
            </div>

            <div className="projects-hero-copy">
              <p>
                Uma seleção criteriosa de endereços com
                relevância arquitetônica, localização
                privilegiada e vocação patrimonial.
              </p>

              <span>
                {projects.length}{' '}
                {projects.length === 1
                  ? 'empreendimento selecionado'
                  : 'empreendimentos selecionados'}
              </span>
            </div>
          </div>
        </section>

        <section className="projects-section">
          <div className="wrap">
            <div className="projects-intro">
              <div>
                <div className="eyebrow">Curadoria</div>

                <h2>
                  Escolhas orientadas por qualidade, não por
                  volume.
                </h2>
              </div>

              <p>
                Explore o portfólio completo e conheça os
                atributos que tornam cada empreendimento
                singular.
              </p>
            </div>

            {projects.length > 0 ? (
              <div className="grid projects-grid">
                {projects.map((project) => (
                  <Card
                    key={project.slug}
                    p={project}
                  />
                ))}
              </div>
            ) : (
              <div className="projects-empty">
                <div className="eyebrow">
                  Portfólio em atualização
                </div>

                <h2>
                  Novos empreendimentos serão apresentados
                  em breve.
                </h2>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
