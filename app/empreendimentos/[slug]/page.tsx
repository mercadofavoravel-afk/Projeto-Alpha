import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { JsonLd } from '@/components/JsonLd';
import { TrackProjectView } from '@/components/TrackProjectView';
import { db } from '@/lib/db';
import { createOrganicLeadSource } from '@/lib/lead-origin';
import { projectAreaLabel, projectRoomLabel } from '@/lib/project-facts';
import { projectImage } from '@/lib/project-image';
import { getProject } from '@/lib/projects';
import { alphaAssetPath } from '@/lib/public-path';
import { breadcrumbJsonLd, createMetadata, projectJsonLd } from '@/lib/seo';
import { LeadCaptureForm } from './LeadCaptureForm';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getPublishedProject(slug: string) {
  return db.project.findFirst({
    where: {
      slug,
      publishStatus: 'PUBLISHED',
    },
    include: {
      neighborhood: true,
      developer: true,
      typologies: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      amenities: {
        include: {
          amenity: true,
        },
      },
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
  });
}

function projectViewModel(project: NonNullable<Awaited<ReturnType<typeof getPublishedProject>>>) {
  const catalogProject = getProject(project.slug);
  const types = project.typologies.map((item) => item.name);

  const collections = project.collections.map((item) => item.collection.name);

  const highlights = project.amenities.map((item) => item.amenity.name);

  return {
    name: project.name,
    slug: project.slug,
    description: project.description,
    neighborhood: project.neighborhood.name,
    image:
      projectImage(project.slug, project.heroImage, ...project.media.map((item) => item.url)) || '',
    status:
      project.statusLabel ||
      (project.publishStatus === 'PUBLISHED' ? 'Disponível' : project.publishStatus),
    types: types.length > 0 ? types : (catalogProject?.types ?? []),
    collections,
    highlights: highlights.length > 0 ? highlights : (catalogProject?.highlights ?? []),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);

  if (!project) {
    return createMetadata({
      title: 'Empreendimento não encontrado',
      description: 'O empreendimento solicitado não está disponível.',
      path: `/empreendimentos/${slug}`,
      noIndex: true,
    });
  }

  const view = projectViewModel(project);

  const description =
    project.seoDescription ||
    `${project.name}, em ${project.neighborhood.name}: ${project.description}. Consulte características, tipologias e disponibilidade.`;

  return createMetadata({
    title: project.seoTitle || `${project.name} em ${project.neighborhood.name}`,
    description,
    path: `/empreendimentos/${project.slug}`,
    image: view.image || undefined,
    imageAlt: `${project.name} — ${project.neighborhood.name}`,
    keywords: [
      project.name,
      project.neighborhood.name,
      ...(project.developer?.name ? [project.developer.name] : []),
      ...view.types,
      ...view.collections,
    ],
  });
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const dbProject = await getPublishedProject(slug);

  if (!dbProject) {
    notFound();
  }

  const project = projectViewModel(dbProject);
  const area = projectAreaLabel(
    project.slug,
    dbProject.areaFrom?.toNumber(),
    dbProject.areaTo?.toNumber(),
  );
  const bedrooms = projectRoomLabel(dbProject.bedroomsFrom, dbProject.bedroomsTo);
  const suites = projectRoomLabel(dbProject.suitesFrom, dbProject.suitesTo, 'suíte');

  const description = `${project.name}, em ${project.neighborhood}: ${project.description}.`;

  const schemas = [
    breadcrumbJsonLd([
      {
        name: 'Início',
        path: '/',
      },
      {
        name: 'Empreendimentos',
        path: '/empreendimentos',
      },
      {
        name: project.name,
        path: `/empreendimentos/${project.slug}`,
      },
    ]),
    projectJsonLd({
      ...project,
      description,
    }),
  ];

  return (
    <>
      <JsonLd data={schemas} />

      <TrackProjectView projectSlug={project.slug} />

      <Header />

      <main>
        <section className="hero property-hero">
          {project.image && (
            <Image
              src={alphaAssetPath(project.image)}
              alt={`${project.name}, ${project.neighborhood}`}
              fill
              priority
              sizes="100vw"
            />
          )}

          <div className="wrap content property-hero-content">
            <div className="eyebrow">{project.neighborhood} · Rio de Janeiro</div>

            <h1>{project.name}</h1>

            <p>{project.description}</p>
          </div>
        </section>

        <section className="property-overview">
          <div className="wrap property-overview-grid">
            <div>
              <div className="eyebrow">O empreendimento</div>

              <h2>O que você encontra em {project.name}.</h2>
            </div>

            <div className="property-overview-copy">
              <p>
                Em {project.neighborhood}, o empreendimento oferece as seguintes opções:{' '}
                {project.description}.{area && ` As unidades anunciadas têm áreas de ${area}.`}
                {project.types.length > 0 &&
                  ` Conheça as opções de ${project.types.join(', ')} e compare as plantas de acordo com o seu perfil.`}
              </p>

              <p className="property-disclaimer">
                Informações comerciais, disponibilidade e condições estão sujeitas à confirmação.
              </p>
            </div>
          </div>
        </section>

        <section className="property-details">
          <div className="wrap">
            <div className="eyebrow">Produto e plantas</div>
            <h2 className="property-details-title">Configurações do empreendimento</h2>
            <div className="property-detail-grid">
              {area && (
                <div className="property-detail-item">
                  <span>Metragens</span>
                  <strong>{area}</strong>
                </div>
              )}

              {bedrooms && (
                <div className="property-detail-item">
                  <span>Dormitórios</span>
                  <strong>{bedrooms}</strong>
                </div>
              )}

              {suites && (
                <div className="property-detail-item">
                  <span>Suítes</span>
                  <strong>{suites}</strong>
                </div>
              )}

              <div className="property-detail-item">
                <span>Localização</span>
                <strong>{project.neighborhood}</strong>
              </div>

              <div className="property-detail-item">
                <span>Status</span>
                <strong>{project.status}</strong>
              </div>

              <div className="property-detail-item">
                <span>Tipologias</span>
                <strong>
                  {project.types.length > 0
                    ? project.types.join(' · ')
                    : 'Consulte as opções disponíveis'}
                </strong>
              </div>

              {dbProject.developer?.name && (
                <div className="property-detail-item">
                  <span>Incorporadora</span>
                  <strong>{dbProject.developer.name}</strong>
                </div>
              )}

              {dbProject.address && (
                <div className="property-detail-item">
                  <span>Endereço</span>
                  <strong>{dbProject.address}</strong>
                </div>
              )}
            </div>

            {dbProject.typologies.some((item) => item.area != null) && (
              <div className="property-plans">
                <h3>Plantas por tipologia</h3>
                <div className="property-plans-grid">
                  {dbProject.typologies.map((item) => (
                    <div className="property-plan" key={item.id}>
                      <strong>{item.name}</strong>
                      {item.area && <span>{item.area.toNumber().toLocaleString('pt-BR')} m²</span>}
                      {item.bedrooms != null && <span>{projectRoomLabel(item.bedrooms)}</span>}
                      {item.suites != null && (
                        <span>{projectRoomLabel(item.suites, null, 'suíte')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.highlights.length > 0 && (
              <div className="property-highlights">
                <div className="eyebrow">Diferenciais do projeto</div>

                <div className="property-highlights-list">
                  {project.highlights.map((highlight) => (
                    <span key={highlight}>{highlight}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="property-concierge">
          <div className="wrap property-concierge-grid">
            <div className="property-concierge-intro">
              <div className="eyebrow">Atendimento reservado</div>

              <h2>Conheça {project.name} com acompanhamento personalizado.</h2>

              <p>
                Compartilhe seus dados para receber informações de disponibilidade, condições
                comerciais e uma seleção orientada ao seu perfil.
              </p>

              <div className="property-concierge-note">
                Atendimento individual, confidencial e sem compromisso.
              </div>
            </div>

            <div className="property-concierge-form">
              <LeadCaptureForm
                projectName={project.name}
                projectSlug={project.slug}
                neighborhood={project.neighborhood}
                source={createOrganicLeadSource({
                  content: `Empreendimento: ${project.name}`,
                  region: project.neighborhood,
                })}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
