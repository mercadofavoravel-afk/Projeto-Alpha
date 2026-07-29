import { Card } from "@/components/Card";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { projects } from "@/lib/projects";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Empreendimentos selecionados",
  description:
    "Conheça empreendimentos de alto padrão selecionados no Rio de Janeiro, com opções para morar, investir e construir patrimônio.",
  path: "/empreendimentos",
});

export default function Page() {
  return (
    <>
      <Header />
      <section className="section">
        <div className="wrap">
          <div className="head">
            <div>
              <div className="eyebrow">Catálogo</div>
              <h1>Empreendimentos</h1>
            </div>
            <p>{projects.length} registros</p>
          </div>
          <div className="grid">
            {projects.map((project) => (
              <Card key={project.slug} p={project} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
