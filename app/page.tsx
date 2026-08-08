import { Card } from '@/components/Card';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { JsonLd } from '@/components/JsonLd';
import { projects } from '@/lib/projects';
import { createMetadata, siteConfig, websiteJsonLd } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Imóveis de alto padrão no Rio de Janeiro',
  description: siteConfig.description,
  path: '/',
  keywords: [
    'imóveis de alto padrão Rio de Janeiro',
    'apartamentos de luxo RJ',
    'lançamentos imobiliários Rio',
  ],
});

export default function Home() {
  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <Header />
      <section className="hero">
        <img src="/images/vie-01.jpg" alt="Imóvel de alto padrão no Rio de Janeiro" />
        <div className="wrap content">
          <div className="eyebrow">Projeto ALPHA</div>
          <h1>Uma plataforma para descobrir imóveis extraordinários.</h1>
          <p>Fonte única de dados para páginas, busca, coleções, SEO e CRM.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="head">
            <div>
              <div className="eyebrow">Destaques</div>
              <h2>Curadoria conectada aos dados.</h2>
            </div>
          </div>
          <div className="grid">
            {projects.slice(0, 6).map((project) => (
              <Card key={project.slug} p={project} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
