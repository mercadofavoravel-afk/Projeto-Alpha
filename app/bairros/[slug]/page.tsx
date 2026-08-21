import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card } from '@/components/Card';
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

async function getNeighborhood(slug: string) {
  return db.neighborhood.findUnique({
    where: {
      slug,
    },
    include: {
      projects: {
        where: {
          publishStatus: 'PUBLISHED',
        },
        include: {
          typologies: true,
          collections: {
            include: {
              collection: true,
            },
            orderBy: {
              position: 'asc',
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
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const neighborhood = await getNeighborhood(slug);

  if (!neighborhood) {
    return createMetadata({
      title: 'Bairro não encontrado',
      description:
        'A localização solicitada não está disponível.',
      path: `/bairros/${slug}`,
      noIndex: true,
    });
  }

  const description =
    neighborhood.seoDescription ||
    neighborhood.description ||
    `Conheça os empreendimentos de alto padrão em ${neighborhood.name}, no Rio de Janeiro, e explore uma seleção orientada por localização, arquitetura e perfil patrimonial.`;

  return createMetadata({
    title:
      neighborhood.seoTitle ||
      `Imóveis de alto padrão em ${neighborhood.name}`,
    description,
    path: `/bairros/${neighborhood.slug}`,
    image:
      neighborhood.heroImage ||
      neighborhood.projects[0]?.heroImage ||
      '/images/og-default.webp',
    imageAlt: `${neighborhood.name} — Rio de Janeiro`,
    keywords: [
      `imóveis em ${neighborhood.name}`,
      `apartamentos em ${neighborhood.name}`,
      `alto padrão ${neighborhood.name}`,
      `empreendimentos ${neighborhood.name}`,
      'imóveis de luxo Rio de Janeiro',
    ],
  });
}

export default async function BairroPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const neighborhood = await getNeighborhood(slug);

  if (!neighborhood) {
    notFound();
  }

  const projects = neighborhood.projects.map(
    (project) => ({
      slug: project.slug,
      name: project.name,
      description: project.description,
      neighborhood: neighborhood.name,
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

  const heroImage =
    neighborhood.heroImage ||
    projects[0]?.image ||
    '/images/og-default.webp';

  return (
    <>
      <Header />

      <main>
        <section className="hero property-hero">
          <Image
            src={heroImage}
            alt={`${neighborhood.name}, Rio de Janeiro`}
            fill
            priority
            sizes="100vw"
          />

          <div className="wrap content property-hero-content">
            <div className="eyebrow">
              Rio de Janeiro
            </div>

            <h1>{neighborhood.name}</h1>

            <p>
              {neighborhood.description ||
                `Um olhar sobre ${neighborhood.name} e os empreendimentos que traduzem diferentes formas de viver esta região do Rio.`}
            </p>
          </div>
        </section>

        <section className="projects-section">
          <div className="wrap">
            <div className="projects-intro">
              <div>
                <div className="eyebrow">
                  Curadoria local
                </div>

                <h2>
                  Empreendimentos em{' '}
                  {neighborhood.name}.
                </h2>
              </div>

              <p>
                Explore os projetos publicados nesta região
                e conheça diferentes tipologias, propostas e
                perfis de moradia.
              </p>
            </div>

            <div className="projects-hero-copy">
              <span>
                {projects.length}{' '}
                {projects.length === 1
                  ? 'empreendimento publicado'
                  : 'empreendimentos publicados'}
              </span>
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
              <div className="notice">
                Ainda não há empreendimentos publicados
                nesta região.
              </div>
            )}
          </div>
        </section>

        <section className="property-overview">
          <div className="wrap property-overview-grid">
            <div>
              <div className="eyebrow">
                Inteligência de mercado
              </div>

              <h2>
                Entenda melhor o mercado de{' '}
                {neighborhood.name}.
              </h2>
            </div>

            <div className="property-overview-copy">
              <p>
                Esta página reúne a curadoria de
                empreendimentos publicados no Alpha para
                esta localização. Conforme novos projetos
                forem adicionados ao catálogo, eles passam
                a integrar automaticamente esta seleção.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
