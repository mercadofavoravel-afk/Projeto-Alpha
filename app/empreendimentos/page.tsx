import { Card } from '@/components/Card';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { projects } from '@/lib/projects';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Empreendimentos selecionados',
  description:
    'Conheça uma seleção de empreendimentos de alto padrão no Rio de Janeiro, escolhidos por localização, arquitetura e valor patrimonial.',
  path: '/empreendimentos',
});

export default function Page() {
  return (
    <>
      <Header />

      <main>
        <section className="projects-hero">
          <div className="wrap projects-hero-grid">
            <div>
              <div className="eyebrow">Portfólio selecionado</div>

              <h1>
                Empreendimentos que traduzem diferentes formas de viver o Rio.
              </h1>
            </div>

            <div className="projects-hero-copy">
              <p>
                Uma seleção criteriosa de endereços com relevância
                arquitetônica, localização privilegiada e vocação
                patrimonial.
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
                <h2>Escolhas orientadas por qualidade, não por volume.</h2>
              </div>

              <p>
                Explore o portfólio completo e conheça os atributos que tornam
                cada empreendimento singular.
              </p>
            </div>

            <div className="grid projects-grid">
              {projects.map((project) => (
                <Card key={project.slug} p={project} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
