import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { JsonLd } from '@/components/JsonLd';
import { TrackProjectView } from '@/components/TrackProjectView';
import { db } from '@/lib/db';
import { createOrganicLeadSource } from '@/lib/lead-origin';
import { projectDisplay } from '@/lib/project-display';
import {
  projectAreaLabel,
  projectBedrooms,
  projectRoomLabel,
  projectSuites,
} from '@/lib/project-facts';
import { projectImage } from '@/lib/project-image';
import { alphaAssetPath } from '@/lib/public-path';
import { breadcrumbJsonLd, createMetadata, projectJsonLd } from '@/lib/seo';
import { LeadCaptureForm } from './LeadCaptureForm';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Editorial introductions based on the catalog, client's Parque Studios book,
// and the Stay 360 developer page. Other projects use their saved description.
const productIntroductions: Record<string, string> = {
  'vie-ipanema':
    'Na Vieira Souto, em frente ao mar, reúne apartamentos e coberturas de grandes metragens. Uma opção para quem busca plantas amplas em Ipanema.',
  'parque-studios':
    'Na região do Jardim de Alah, reúne studios e lofts de 35 a 40 m², double studios de 55 a 59 m² e coberturas. O projeto inclui lazer no rooftop e serviços como mini market e espaço para entregas.',
  'bruma-mozak':
    'No Leblon, combina apartamentos, gardens e coberturas duplex em um edifício boutique. O catálogo apresenta opções de 4 e 5 suítes e uma unidade por andar.',
  'stay-360-leblon':
    'Na Visconde de Albuquerque, no Leblon, reúne studios e gardens de 28 a 50 m², além de coberturas. O lazer no rooftop amplia as opções de uso dos espaços comuns.',
  'be-in-rio-prudente-589':
    'Na quadra da praia em Ipanema, reúne studios, gardens, up gardens, doubles e coberturas lineares. A área comum na cobertura tem piscina, lounge, fitness e sauna; o térreo inclui minimercado e espaço para entregas.',
  'be-in-rio-nascimento-silva-387':
    'Em Ipanema, reúne studios, gardens, up gardens, double suítes e coberturas lineares. Portaria com minimercado, espaço para entregas e coworking se somam ao fitness e lazer na cobertura.',
  'cronos-barra':
    'Na Barra da Tijuca, apresenta apartamentos de 2, 3 e 4 quartos e coberturas, com metragens de 77 a 301 m². A torre única reúne espaços de lazer e rooftop.',
  'be-in-rio-arpoador':
    'Na Rua Bulhões de Carvalho, no Arpoador, oferece apartamentos, double e triple suítes, além de cobertura duplex. O material da coleção apresenta plantas de 43,10 a 92,11 m².',
  'guilherm-mozak':
    'Na Rua Almirante Guilhem, no Leblon, reúne estúdios, unidades sala/quarto e double suítes. As duas piscinas no rooftop, a academia, o coworking e os serviços de conveniência ampliam o uso do edifício.',
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
  const display = projectDisplay({
    slug: project.slug,
    name: project.name,
    description: project.description,
    types: project.typologies.map((item) => item.name),
    highlights: project.amenities.map((item) => item.amenity.name),
  });
  const collections = project.collections.map((item) => item.collection.name);

  return {
    name: display.name,
    slug: project.slug,
    description: display.description,
    neighborhood: project.neighborhood.name,
    image:
      projectImage(project.slug, project.heroImage, ...project.media.map((item) => item.url)) || '',
    status:
      project.statusLabel ||
      (project.publishStatus === 'PUBLISHED' ? 'Disponível' : project.publishStatus),
    types: display.types,
    collections,
    highlights: display.highlights,
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
  const bedrooms = projectBedrooms(project.slug, dbProject.bedroomsFrom, dbProject.bedroomsTo);
  const suites = projectSuites(project.slug, dbProject.suitesFrom, dbProject.suitesTo);
  const introduction =
    productIntroductions[project.slug] ||
    `${project.name} fica em ${project.neighborhood}. ${project.description.replace(/[.!?]+$/, '')}.`;

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
              alt={
                project.image.includes('/images/be-in-rio-')
                  ? `Perspectiva ilustrativa da fachada do ${project.name}, ${project.neighborhood}`
                  : `${project.name}, ${project.neighborhood}`
              }
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
              <p>{introduction}</p>

              {project.types.length > 0 && (
                <p>Explore as configurações de {project.types.join(', ')} e compare as plantas.</p>
              )}

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
