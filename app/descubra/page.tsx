import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { createMetadata } from "@/lib/seo";
import { RecommendationQuiz } from "./RecommendationQuiz";

export const metadata = createMetadata({
  title: "Descubra o imóvel ideal",
  description:
    "Informe suas prioridades e receba uma seleção explicável de imóveis de alto padrão no Rio de Janeiro alinhados ao seu momento e objetivo.",
  path: "/descubra",
});

export default function Page() {
  return (
    <>
      <Header />
      <section className="section">
        <div className="wrap">
          <div className="head">
            <div>
              <div className="eyebrow">Recomendação ALPHA</div>
              <h1>Descubra imóveis alinhados ao seu momento.</h1>
            </div>
            <p>
              Informe prioridades e receba uma seleção explicável. Valores e disponibilidade
              exigem confirmação.
            </p>
          </div>
          <RecommendationQuiz />
        </div>
      </section>
      <Footer />
    </>
  );
}
