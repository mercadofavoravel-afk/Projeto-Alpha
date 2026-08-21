import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { db } from '@/lib/db';
import { createMetadata } from '@/lib/seo';
import { LeadCaptureForm } from '@/app/empreendimentos/[slug]/LeadCaptureForm';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type HighlightItem = {
  title: string;
  description?: string;
};

type FaqItem = {
  question: string;
  answer: string;
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
          developer: true,
          typologies: true,
          media: {
            orderBy: {
              position: 'asc',
            },
          },
          amenities: {
            include: {
              amenity: true,
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

function parseHighlights(value: unknown): HighlightItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): HighlightItem | null => {
      if (typeof item === 'string') {
        return {
          title: item,
        };
      }

      if (
        typeof item === 'object' &&
        item !== null &&
        'title' in item &&
        typeof item.title === 'string'
      ) {
        return {
          title: item.title,
          description:
            'description' in item &&
            typeof item.description === 'string'
              ? item.description
              : undefined,
        };
      }

      return null;
    })
    .filter(
      (item): item is HighlightItem => item !== null,
    );
}

function parseFaq(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): FaqItem | null => {
      if (
        typeof item === 'object' &&
        item !== null &&
        'question' in item &&
        'answer' in item &&
        typeof item.question === 'string' &&
        typeof item.answer === 'string'
      ) {
        return {
          question: item.question,
          answer: item.answer,
        };
      }

      return null;
    })
    .filter((item): item is FaqItem => item !== null);
}

function getVideoEmbed(url?: string | null) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);

    if (
      parsed.hostname.includes('youtube.com') &&
      parsed.pathname === '/watch'
    ) {
      const id = parsed.searchParams.get('v');

      return id
        ? `https://www.youtube.com/embed/${id}`
        : null;
    }

    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace('/', '');

      return id
        ? `https://www.youtube.com/embed/${id}`
        : null;
    }

    if (
      parsed.hostname.includes('youtube.com') &&
      parsed.pathname.startsWith('/embed/')
    ) {
      return url;
    }

    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname
        .split('/')
        .filter(Boolean)
        .find((part) => /^\d+$/.test(part));

      return id
        ? `https://player.vimeo.com/video/${id}`
        : null;
    }
  } catch {
    return null;
  }

  return null;
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
    `Descubra como é viver em ${neighborhood.name}, no Rio de Janeiro. Conheça o estilo de vida da região e os empreendimentos de alto padrão disponíveis.`;

  return createMetadata({
    title:
      neighborhood.seoTitle ||
      `Imóveis de alto padrão em ${neighborhood.name}`,
    description,
    path: `/bairros/${neighborhood.slug}`,
    image:
      neighborhood.heroImage ||
      neighborhood.projects[0]?.heroImage ||
      neighborhood.projects[0]?.media[0]?.url ||
      '/images/og-default.webp',
    imageAlt: `${neighborhood.name} — Rio de Janeiro`,
    keywords: [
      `imóveis em ${neighborhood.name}`,
      `apartamentos em ${neighborhood.name}`,
      `alto padrão ${neighborhood.name}`,
      `morar em ${neighborhood.name}`,
      `empreendimentos ${neighborhood.name}`,
      `lançamentos ${neighborhood.name}`,
      `imóveis de luxo Rio de Janeiro`,
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

  const highlights = parseHighlights(
    neighborhood.highlights,
  );

  const faq = parseFaq(neighborhood.faq);

  const heroImage =
    neighborhood.heroImage ||
    neighborhood.projects[0]?.heroImage ||
    neighborhood.projects[0]?.media[0]?.url ||
    '/images/og-default.webp';

  const videoEmbed = getVideoEmbed(
    neighborhood.videoUrl,
  );

  const experienceTitle =
    neighborhood.experienceTitle ||
    `Como é viver em ${neighborhood.name}`;

  const experienceDescription =
    neighborhood.experienceDescription ||
    neighborhood.description ||
    `${neighborhood.name} reúne localização, conveniência e diferentes experiências de vida no Rio de Janeiro. Nossa curadoria acompanha os principais empreendimentos da região para ajudar você a compreender melhor cada oportunidade.`;

  const ctaTitle =
    neighborhood.ctaTitle ||
    `Encontre o imóvel certo em ${neighborhood.name}.`;

  const ctaDescription =
    neighborhood.ctaDescription ||
    `Conte para nossa equipe o que você procura. Vamos preparar uma seleção reservada de oportunidades alinhadas ao seu perfil, objetivo e faixa de investimento.`;

  return (
    <>
      <Header />

      <main className="bairro-premium">
        <section
          className="bairro-hero"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(9, 15, 18, 0.82) 0%, rgba(9, 15, 18, 0.54) 48%, rgba(9, 15, 18, 0.15) 100%), url("${heroImage}")`,
          }}
        >
          <div className="bairro-shell bairro-hero-inner">
            <div className="bairro-kicker">
              Rio de Janeiro · Curadoria local
            </div>

            <h1>{neighborhood.name}</h1>

            <p className="bairro-hero-copy">
              {neighborhood.description ||
                `Um olhar exclusivo sobre ${neighborhood.name}, seus endereços, estilo de vida e oportunidades imobiliárias.`}
            </p>

            <div className="bairro-hero-actions">
              <a
                className="bairro-primary"
                href="#empreendimentos"
              >
                Explorar empreendimentos
              </a>

              <a
                className="bairro-secondary"
                href="#atendimento"
              >
                Receber seleção personalizada
              </a>
            </div>

            <div className="bairro-hero-stat">
              <strong>
                {neighborhood.projects.length}
              </strong>

              <span>
                {neighborhood.projects.length === 1
                  ? 'empreendimento publicado'
                  : 'empreendimentos publicados'}
              </span>
            </div>
          </div>
        </section>

        <section className="bairro-experience">
          <div className="bairro-shell bairro-two-columns">
            <div>
              <div className="bairro-kicker dark">
                Experiência local
              </div>

              <h2>{experienceTitle}</h2>
            </div>

            <div className="bairro-editorial-copy">
              <p>{experienceDescription}</p>

              <p>
                Para quem está chegando ao Rio, entender
                uma localização vai além do endereço. É
                compreender rotina, deslocamentos,
                conveniência, lazer e o perfil dos imóveis
                disponíveis.
              </p>
            </div>
          </div>
        </section>

        {highlights.length > 0 && (
          <section className="bairro-highlights-section">
            <div className="bairro-shell">
              <div className="bairro-section-head">
                <div>
                  <div className="bairro-kicker dark">
                    Por que escolher
                  </div>

                  <h2>
                    O que torna {neighborhood.name}{' '}
                    especial.
                  </h2>
                </div>

                <p>
                  Aspectos que ajudam a compreender a
                  experiência de morar, investir ou manter
                  patrimônio nesta região.
                </p>
              </div>

              <div className="bairro-highlights">
                {highlights.map((highlight, index) => (
                  <article
                    key={`${highlight.title}-${index}`}
                    className="bairro-highlight"
                  >
                    <span>
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <h3>{highlight.title}</h3>

                    {highlight.description && (
                      <p>{highlight.description}</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {neighborhood.videoUrl && (
          <section className="bairro-video-section">
            <div className="bairro-shell">
              <div className="bairro-section-head light">
                <div>
                  <div className="bairro-kicker">
                    Conheça a região
                  </div>

                  <h2>
                    {neighborhood.videoTitle ||
                      `${neighborhood.name} em movimento.`}
                  </h2>
                </div>

                <p>
                  Uma perspectiva visual para conhecer
                  melhor o ritmo, a paisagem e a experiência
                  desta localização.
                </p>
              </div>

              <div className="bairro-video">
                {videoEmbed ? (
                  <iframe
                    src={videoEmbed}
                    title={
                      neighborhood.videoTitle ||
                      `Vídeo sobre ${neighborhood.name}`
                    }
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : /\.(mp4|webm)(\?.*)?$/i.test(
                    neighborhood.videoUrl,
                  ) ? (
                  <video
                    controls
                    playsInline
                    preload="metadata"
                  >
                    <source
                      src={neighborhood.videoUrl}
                    />
                  </video>
                ) : (
                  <a
                    className="bairro-video-link"
                    href={neighborhood.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Assistir vídeo sobre{' '}
                    {neighborhood.name} →
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="bairro-conversion-strip">
          <div className="bairro-shell bairro-conversion-inner">
            <div>
              <div className="bairro-kicker">
                Curadoria personalizada
              </div>

              <h2>{ctaTitle}</h2>

              <p>{ctaDescription}</p>
            </div>

            <a
              href="#atendimento"
              className="bairro-primary light-button"
            >
              Quero receber oportunidades
            </a>
          </div>
        </section>

        <section
          id="empreendimentos"
          className="bairro-projects"
        >
          <div className="bairro-shell">
            <div className="bairro-section-head">
              <div>
                <div className="bairro-kicker dark">
                  Portfólio local
                </div>

                <h2>
                  Empreendimentos selecionados em{' '}
                  {neighborhood.name}.
                </h2>
              </div>

              <p>
                Projetos publicados no Alpha e
                acompanhados pela nossa curadoria.
              </p>
            </div>

            {neighborhood.projects.length > 0 ? (
              <div className="bairro-project-grid">
                {neighborhood.projects.map(
                  (project, index) => {
                    const image =
                      project.heroImage ||
                      project.media[0]?.url ||
                      '/images/og-default.webp';

                    const typologies =
                      project.typologies
                        .map((item) => item.name)
                        .slice(0, 3)
                        .join(' · ');

                    return (
                      <Link
                        href={`/empreendimentos/${project.slug}`}
                        key={project.id}
                        className={`bairro-project-card ${
                          index === 0
                            ? 'bairro-project-featured'
                            : ''
                        }`}
                        style={{
                          backgroundImage: `linear-gradient(0deg, rgba(8, 14, 17, 0.88) 0%, rgba(8, 14, 17, 0.10) 72%), url("${image}")`,
                        }}
                      >
                        <div className="bairro-project-content">
                          <span>
                            {project.developer?.name ||
                              neighborhood.name}
                          </span>

                          <h3>{project.name}</h3>

                          <p>
                            {typologies ||
                              project.description}
                          </p>

                          <strong>
                            Conhecer empreendimento →
                          </strong>
                        </div>
                      </Link>
                    );
                  },
                )}
              </div>
            ) : (
              <div className="bairro-empty">
                Nossa curadoria está atualizando as
                oportunidades disponíveis nesta região.
              </div>
            )}
          </div>
        </section>

        {faq.length > 0 && (
          <section className="bairro-faq">
            <div className="bairro-shell bairro-two-columns">
              <div>
                <div className="bairro-kicker dark">
                  Para quem está pesquisando
                </div>

                <h2>
                  Perguntas sobre{' '}
                  {neighborhood.name}.
                </h2>
              </div>

              <div className="bairro-faq-list">
                {faq.map((item, index) => (
                  <details
                    key={`${item.question}-${index}`}
                  >
                    <summary>
                      {item.question}
                    </summary>

                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        <section
          id="atendimento"
          className="bairro-lead-section"
        >
          <div className="bairro-shell bairro-lead-grid">
            <div className="bairro-lead-copy">
              <div className="bairro-kicker">
                Atendimento reservado
              </div>

              <h2>
                Receba uma seleção personalizada em{' '}
                {neighborhood.name}.
              </h2>

              <p>
                Informe seu perfil e sua faixa de
                investimento. Nossa equipe poderá apresentar
                oportunidades alinhadas ao que você procura,
                inclusive alternativas que façam sentido
                para comparação.
              </p>

              <div className="bairro-lead-points">
                <span>
                  Curadoria orientada ao seu perfil
                </span>
                <span>
                  Atendimento individual
                </span>
                <span>
                  Informações comerciais sob consulta
                </span>
              </div>
            </div>

            <div className="bairro-lead-form">
              <LeadCaptureForm
                projectName={`Curadoria em ${neighborhood.name}`}
                projectSlug={`bairro-${neighborhood.slug}`}
                neighborhood={neighborhood.name}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .bairro-premium {
          background: #f4f1eb;
          color: #162126;
        }

        .bairro-shell {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        .bairro-hero {
          min-height: 82vh;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: flex-end;
          color: #fff;
        }

        .bairro-hero-inner {
          padding: 150px 0 88px;
          position: relative;
        }

        .bairro-kicker {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .28em;
          font-weight: 700;
          margin-bottom: 18px;
          color: rgba(255,255,255,.72);
        }

        .bairro-kicker.dark {
          color: #8b7254;
        }

        .bairro-hero h1 {
          margin: 0;
          max-width: 900px;
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 400;
          font-size: clamp(64px, 10vw, 142px);
          line-height: .88;
          letter-spacing: -.055em;
        }

        .bairro-hero-copy {
          max-width: 620px;
          font-size: 19px;
          line-height: 1.7;
          margin: 34px 0;
          color: rgba(255,255,255,.86);
        }

        .bairro-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .bairro-primary,
        .bairro-secondary {
          min-height: 52px;
          padding: 0 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: 11px;
          font-weight: 700;
          transition: .25s ease;
        }

        .bairro-primary {
          background: #b5976c;
          color: #fff;
          border: 1px solid #b5976c;
        }

        .bairro-primary:hover {
          background: #c5a87d;
          border-color: #c5a87d;
        }

        .bairro-secondary {
          border: 1px solid rgba(255,255,255,.42);
          color: #fff;
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(10px);
        }

        .bairro-hero-stat {
          position: absolute;
          right: 0;
          bottom: 88px;
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .bairro-hero-stat strong {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 40px;
          font-weight: 400;
        }

        .bairro-hero-stat span {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .14em;
          color: rgba(255,255,255,.65);
        }

        .bairro-experience,
        .bairro-faq {
          padding: 120px 0;
        }

        .bairro-two-columns {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 110px;
          align-items: start;
        }

        .bairro-two-columns h2,
        .bairro-section-head h2,
        .bairro-conversion-inner h2,
        .bairro-lead-copy h2 {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(38px, 5vw, 64px);
          line-height: 1.03;
          font-weight: 400;
          letter-spacing: -.035em;
        }

        .bairro-editorial-copy {
          font-size: 18px;
          line-height: 1.9;
          color: #536066;
        }

        .bairro-editorial-copy p:first-child {
          color: #202c31;
          font-size: 22px;
        }

        .bairro-highlights-section,
        .bairro-projects {
          padding: 110px 0;
          background: #fff;
        }

        .bairro-section-head {
          display: grid;
          grid-template-columns: 1.25fr .75fr;
          gap: 80px;
          align-items: end;
          margin-bottom: 58px;
        }

        .bairro-section-head > p {
          margin: 0;
          color: #667177;
          line-height: 1.75;
          font-size: 16px;
        }

        .bairro-highlights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid #d9d4cc;
        }

        .bairro-highlight {
          padding: 38px 30px 42px 0;
          border-bottom: 1px solid #d9d4cc;
          margin-right: 30px;
        }

        .bairro-highlight span {
          color: #a58861;
          font-size: 11px;
          letter-spacing: .18em;
        }

        .bairro-highlight h3 {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 28px;
          font-weight: 400;
          margin: 24px 0 14px;
        }

        .bairro-highlight p {
          color: #687278;
          line-height: 1.7;
          margin: 0;
        }

        .bairro-video-section {
          padding: 110px 0;
          background: #111b20;
          color: #fff;
        }

        .bairro-section-head.light > p {
          color: rgba(255,255,255,.58);
        }

        .bairro-video {
          aspect-ratio: 16 / 8.5;
          background: #070b0d;
          overflow: hidden;
        }

        .bairro-video iframe,
        .bairro-video video {
          width: 100%;
          height: 100%;
          border: 0;
          object-fit: cover;
        }

        .bairro-video-link {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: .14em;
          text-decoration: none;
        }

        .bairro-conversion-strip {
          background: #b1946b;
          color: #fff;
          padding: 74px 0;
        }

        .bairro-conversion-inner {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 70px;
          align-items: center;
        }

        .bairro-conversion-inner p {
          max-width: 680px;
          line-height: 1.7;
          color: rgba(255,255,255,.82);
        }

        .light-button {
          background: #fff;
          color: #192329;
          border-color: #fff;
          white-space: nowrap;
        }

        .bairro-project-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        .bairro-project-card {
          min-height: 460px;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: flex-end;
          color: #fff;
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }

        .bairro-project-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(5,10,12,0);
          transition: .3s ease;
        }

        .bairro-project-card:hover::before {
          background: rgba(5,10,12,.18);
        }

        .bairro-project-featured {
          grid-column: 1 / -1;
          min-height: 640px;
        }

        .bairro-project-content {
          position: relative;
          z-index: 2;
          padding: 42px;
          max-width: 700px;
        }

        .bairro-project-content > span {
          display: block;
          font-size: 10px;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: rgba(255,255,255,.68);
          margin-bottom: 12px;
        }

        .bairro-project-content h3 {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(34px, 4vw, 54px);
          font-weight: 400;
          margin: 0 0 12px;
        }

        .bairro-project-content p {
          margin: 0 0 24px;
          color: rgba(255,255,255,.72);
        }

        .bairro-project-content strong {
          font-size: 10px;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .bairro-empty {
          padding: 60px;
          text-align: center;
          border: 1px solid #d7d0c7;
          color: #657077;
        }

        .bairro-faq-list details {
          border-top: 1px solid #d3cec6;
          padding: 24px 0;
        }

        .bairro-faq-list details:last-child {
          border-bottom: 1px solid #d3cec6;
        }

        .bairro-faq-list summary {
          cursor: pointer;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 21px;
          color: #1c282d;
        }

        .bairro-faq-list details p {
          color: #667177;
          line-height: 1.8;
          padding-right: 30px;
        }

        .bairro-lead-section {
          padding: 120px 0;
          background: #101a1f;
          color: #fff;
        }

        .bairro-lead-grid {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 100px;
          align-items: start;
        }

        .bairro-lead-copy p {
          font-size: 17px;
          line-height: 1.8;
          color: rgba(255,255,255,.66);
          max-width: 540px;
        }

        .bairro-lead-points {
          display: grid;
          gap: 12px;
          margin-top: 36px;
        }

        .bairro-lead-points span {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .12em;
          color: rgba(255,255,255,.68);
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,.12);
        }

        .bairro-lead-form {
          background: #fff;
          color: #172228;
          padding: 34px;
        }

        @media (max-width: 900px) {
          .bairro-shell {
            width: min(100% - 28px, 1180px);
          }

          .bairro-hero {
            min-height: 720px;
          }

          .bairro-hero-inner {
            padding: 120px 0 70px;
          }

          .bairro-hero-stat {
            position: static;
            text-align: left;
            margin-top: 40px;
          }

          .bairro-two-columns,
          .bairro-section-head,
          .bairro-conversion-inner,
          .bairro-lead-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .bairro-highlights {
            grid-template-columns: 1fr;
          }

          .bairro-project-grid {
            grid-template-columns: 1fr;
          }

          .bairro-project-featured {
            grid-column: auto;
            min-height: 500px;
          }

          .bairro-project-card {
            min-height: 440px;
          }

          .bairro-experience,
          .bairro-faq,
          .bairro-projects,
          .bairro-highlights-section,
          .bairro-video-section,
          .bairro-lead-section {
            padding: 78px 0;
          }
        }
      `}</style>
    </>
  );
}
