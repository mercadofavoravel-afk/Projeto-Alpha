import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { projects } from '@/lib/projects';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Coleções de imóveis de alto padrão',
  description:
    'Explore coleções editoriais de imóveis de alto padrão no Rio de Janeiro, reunidas por estilo, localização, tipologia e objetivo.',
  path: '/colecoes',
});

export default function Page() {
  const collections = [
    ...new Set(
      projects.flatMap((project) => project.collections),
    ),
  ].sort();

  return (
    <>
      <Header />

      <main>
        <section className="collections-hero">
          <div className="wrap collections-hero-grid">
            <div>
              <div className="eyebrow">Navegação editorial</div>

              <h1>
                Coleções para diferentes formas de viver o Rio.
              </h1>
            </div>

            <div className="collections-hero-copy">
              <p>
                Uma leitura curada do portfólio por estilo de vida,
                localização, arquitetura e intenção patrimonial.
              </p>

              <span>
                Menos volume. Mais contexto para escolher melhor.
              </span>
            </div>
          </div>
        </section>

        <section className="collections-section">
          <div className="wrap">
            <div className="collections-grid">
              {collections.map((collection, index) => {
                const relatedProjects = projects.filter((project) =>
                  project.collections.includes(collection),
                );

                const featuredProject = relatedProjects[0];

                return (
                  <article
                    className="collection-card"
                    key={collection}
                  >
                    <div className="collection-number">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div className="collection-card-content">
                      <div className="eyebrow">Coleção</div>

                      <h2>{collection}</h2>

                      <p>
                        {relatedProjects.length}{' '}
                        {relatedProjects.length === 1
                          ? 'empreendimento selecionado'
                          : 'empreendimentos selecionados'}
                        .
                      </p>

                      {featuredProject && (
                        <div className="collection-preview">
                          <span>Em destaque</span>
                          <strong>{featuredProject.name}</strong>
                          <small>
                            {featuredProject.neighborhood}
                          </small>
                        </div>
                      )}

                      <Link
                        className="collection-link"
                        href={`/buscar?q=${encodeURIComponent(collection)}`}
                      >
                        Explorar seleção
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
