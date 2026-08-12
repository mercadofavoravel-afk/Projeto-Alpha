import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { projects } from '@/lib/projects';
import { createMetadata } from '@/lib/seo';
import { Search } from './Search';

export const metadata = createMetadata({
  title: 'Buscar imóveis de alto padrão no Rio de Janeiro',
  description:
    'Busque imóveis de alto padrão no Rio de Janeiro por nome, bairro, tipologia e características.',
  path: '/buscar',
  keywords: [
    'buscar imóveis Rio de Janeiro',
    'imóveis de luxo RJ',
    'apartamentos alto padrão Rio',
  ],
});

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    bairro?: string;
  }>;
}) {
  const params = await searchParams;

  const initialQuery =
    typeof params.q === 'string' ? params.q : '';

  const initialNeighborhood =
    typeof params.bairro === 'string' ? params.bairro : '';

  return (
    <>
      <Header />

      <main>
        <section className="section">
          <div className="wrap">
            <div className="head">
              <div>
                <div className="eyebrow">Busca</div>
                <h1>Encontre seu próximo imóvel.</h1>
              </div>

              <p>
                Pesquise o catálogo por empreendimento,
                bairro ou características.
              </p>
            </div>

            <Search
              projects={projects}
              initialQuery={initialQuery}
              initialNeighborhood={initialNeighborhood}
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
