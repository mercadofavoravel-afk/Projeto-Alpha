import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { createMetadata } from '@/lib/seo';
import { RecommendationQuiz } from './RecommendationQuiz';

export const metadata = createMetadata({
  title: 'Descubra o imóvel ideal',
  description:
    'Informe suas prioridades e receba uma seleção personalizada de imóveis de alto padrão no Rio de Janeiro, alinhada ao seu perfil, momento e objetivo.',
  path: '/descubra',
});

export default function Page() {
  return (
    <>
      <Header />

      <main>
        <section className="discovery-hero">
          <div className="wrap discovery-hero-grid">
            <div>
              <div className="eyebrow">Curadoria personalizada</div>

              <h1>
                Seu próximo endereço começa pelo seu perfil.
              </h1>
            </div>

            <div className="discovery-hero-copy">
              <p>
                Compartilhe suas preferências, prioridades e objetivos.
                A partir delas, apresentamos uma seleção de imóveis com
                maior aderência ao seu momento.
              </p>

              <span>
                Uma experiência de descoberta, não uma busca genérica.
              </span>
            </div>
          </div>
        </section>

        <section className="discovery-experience">
          <div className="wrap discovery-experience-grid">
            <div className="discovery-guidance">
              <div className="eyebrow">Como funciona</div>

              <h2>
                Critérios que ajudam a revelar o imóvel certo.
              </h2>

              <p>
                Localização, tipologia, orçamento, estilo de vida e
                objetivo patrimonial são combinados para formar uma
                seleção mais relevante.
              </p>

              <div className="discovery-principles">
                <span>Curadoria orientada</span>
                <span>Seleção explicável</span>
                <span>Atendimento reservado</span>
              </div>
            </div>

            <div className="discovery-quiz-shell">
              <RecommendationQuiz />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
