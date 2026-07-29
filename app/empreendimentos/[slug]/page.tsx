import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { TrackProjectView } from "@/components/TrackProjectView";
import { getProject, projects } from "@/lib/projects";
import {
  breadcrumbJsonLd,
  createMetadata,
  projectJsonLd,
} from "@/lib/seo";
import { notFound } from "next/navigation";

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
      title: "Empreendimento não encontrado",
      description: "O empreendimento solicitado não está disponível.",
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
    keywords: [project.name, project.neighborhood, ...project.types, ...project.collections],
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const description = `${project.name}, em ${project.neighborhood}: ${project.description}.`;
  const schemas = [
    breadcrumbJsonLd([
      { name: "Início", path: "/" },
      { name: "Empreendimentos", path: "/empreendimentos" },
      { name: project.name, path: `/empreendimentos/${project.slug}` },
    ]),
    projectJsonLd({ ...project, description }),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <TrackProjectView projectSlug={project.slug} />
      <Header />
      <section className="hero">
        <img src={project.image} alt={`${project.name}, ${project.neighborhood}`} />
        <div className="wrap content">
          <div className="eyebrow">{project.neighborhood}</div>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="notice">
            Valores, disponibilidade e condições comerciais devem ser confirmados.
          </div>
          <div className="tags">
            {project.types.map((type) => (
              <span className="tag" key={type}>
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
