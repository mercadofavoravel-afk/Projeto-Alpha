import Image from 'next/image';
import Link from 'next/link';
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

      <main>
        <section className="hero hero-home">
          <Image
            src="/images/vie-01.jpg"
            alt="Residência de alto padrão no Rio de Janeiro"
            fill
            priority
            sizes="100vw"
          />

          <div className="wrap content">
            <div className="eyebrow">Rio de Janeiro · Curadoria imobiliária</div>

            <h1>
              Endereços extraordinários.
              <br />
              Escolhas à altura.
            </h1>

            <p>
              Uma seleção criteriosa de residências e empreendimentos
              excepcionais nos endereços mais desejados do Rio de Janeiro.
            </p>

            <Link className="hero-link" href="/descubra">
              Descobrir imóveis
            </Link>
          </div>
        </section>

        <section className="section section-intro">
          <div className="wrap luxury-intro">
            <div className="eyebrow">Seleção privada</div>

            <div>
              <h2>
                Imóveis escolhidos por localização, arquitetura e
                singularidade.
              </h2>

              <p>
                Nossa curadoria reúne propriedades para quem procura mais do
                que metragem: vista, endereço, privacidade, desenho e valor
                patrimonial.
              </p>
            </div>
          </div>
        </section>

        <section className="section featured-section">
          <div className="wrap">
            <div className="head">
              <div>
                <div className="eyebrow">Destaques</div>
                <h2>Uma curadoria para poucos endereços.</h2>
              </div>

              <p>
                Conheça uma seleção de empreendimentos em regiões emblemáticas
                do Rio de Janeiro.
              </p>
            </div>

            <div className="grid">
              {projects.slice(0, 6).map((project) => (
                <Card key={project.slug} p={project} />
              ))}
            </div>

            <div className="section-action">
              <Link className="text-link" href="/empreendimentos">
                Ver todos os empreendimentos
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
