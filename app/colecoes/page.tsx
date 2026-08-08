import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { projects } from '@/lib/projects';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Coleções de imóveis',
  description:
    'Explore coleções editoriais de imóveis de alto padrão no Rio de Janeiro, organizadas por estilo, localização, tipologia e objetivo.',
  path: '/colecoes',
});

export default function Page() {
  const collections = [...new Set(projects.flatMap((project) => project.collections))].sort();
  return (
    <>
      <Header />
      <section className="section">
        <div className="wrap">
          <div className="head">
            <div>
              <div className="eyebrow">Navegação editorial</div>
              <h1>Coleções</h1>
            </div>
          </div>
          <div className="grid">
            {collections.map((collection) => (
              <article className="card" key={collection}>
                <div className="copy">
                  <div className="eyebrow">Coleção</div>
                  <h2>{collection}</h2>
                  <p>
                    {projects.filter((project) => project.collections.includes(collection)).length}{' '}
                    empreendimentos relacionados.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
