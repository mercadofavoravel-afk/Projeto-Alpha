import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { projects } from '@/lib/projects';
import { createMetadata } from '@/lib/seo';
import { Search } from './Search';

export const metadata = createMetadata({
  title: 'Buscar imóveis',
  description:
    'Busque imóveis de alto padrão no Rio de Janeiro por localização, tipologia, coleção ou objetivo e encontre opções alinhadas ao seu perfil.',
  path: '/buscar',
});

export default function Page() {
  return (
    <>
      <Header />
      <section className="section">
        <div className="wrap">
          <div className="head">
            <div>
              <div className="eyebrow">Busca inteligente</div>
              <h1>Encontre pelo seu objetivo.</h1>
            </div>
          </div>
          <Search projects={projects} />
        </div>
      </section>
      <Footer />
    </>
  );
}
