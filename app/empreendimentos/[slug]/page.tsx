import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { JsonLd } from '@/components/JsonLd';
import { TrackProjectView } from '@/components/TrackProjectView';
import { getProject, projects } from '@/lib/projects';
import {
  breadcrumbJsonLd,
  createMetadata,
  projectJsonLd,
} from '@/lib/seo';
import { LeadCaptureForm } from './LeadCaptureForm';

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return createMetadata({
      title: 'Empreendimento não encontrado',
      description: 'O empreendimento solicitado não está disponível.',
      path: `/empreendimentos/${slug}`,
      noIndex: true,
    });
  }

  const description = `${project.name}, em ${project.neighborhood}: ${project.description}. Consulte características, tipologias e disponibilidade.`;

  return createMetadata({
    title: `${project.name} em ${project.neighborhood}`,
    description,
    path: `/empreendimentos/${project.slug}`,
    image: project.image,
    imageAlt: `${project.name} — ${project.neighborhood}`,
    keywords: [
      project.name,
      project.neighborhood,
      ...project.types,
      ...project.collections,
    ],
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  const description = `${project.name}, em ${project.neighborhood}: ${project.description}.`;

  const schemas = [
    breadcrumbJsonLd([
      { name: 'Início', path: '/' },
      { name: 'Empreendimentos', path: '/empreendimentos' },
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
          <Image
            src={project.image}
            alt={`${project.name}, ${project.neighborhood}`}
            fill
            priority
            sizes="100vw"
          />

          <div className="wrap content property-hero-content">
            <div className="eyebrow">
              {project.neighborhood} · Rio de Janeiro
            </div>

            <h1>{project.name}</h1>

            <p>{project.description}</p>
          </div>
        </section>

        <section className="property-overview">
          <div className="wrap property-overview-grid">
            <div>
              <div className="eyebrow">O empreendimento</div>

              <h2>
                Um endereço singular em {project.neighborhood}.
              </h2>
            </div>

            <div className="property-overview-copy">
              <p>{project.description}</p>

              <p className="property-disclaimer">
                Informações comerciais, disponibilidade e condições
                estão sujeitas à confirmação.
              </p>
            </div>
          </div>
        </section>

        <section className="property-details">
          <div className="wrap">
            <div className="property-detail-grid">
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
                <strong>{project.types.join(' · ')}</strong>
              </div>

              <div className="property-detail-item">
                <span>Perfil</span>
                <strong>
                  {project.collections.length > 0
                    ? project.collections.join(' · ')
                    : 'Curadoria residencial'}
                </strong>
              </div>
            </div>

            {project.highlights.length > 0 && (
              <div className="property-highlights">
                <div className="eyebrow">Destaques</div>

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

              <h2>
                Conheça {project.name} com acompanhamento personalizado.
              </h2>

              <p>
                Compartilhe seus dados para receber informações de
                disponibilidade, condições comerciais e uma seleção
                orientada ao seu perfil.
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
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
