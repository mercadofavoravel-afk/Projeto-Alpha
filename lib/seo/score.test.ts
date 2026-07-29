import { describe, expect, it } from "vitest";
import { calculateSeoScore } from "./score";

const completeDocument = {
  name: "Ipanema",
  slug: "ipanema",
  heroImage: "/images/ipanema.jpg",
  seoTitle: "Imóveis de luxo em Ipanema no Rio de Janeiro",
  seoDescription:
    "Conheça imóveis de alto padrão em Ipanema, com curadoria especializada, localização privilegiada e atendimento consultivo no Rio de Janeiro.",
  description:
    "Ipanema reúne praia, mobilidade, gastronomia e uma oferta imobiliária de alto padrão reconhecida internacionalmente, com opções para moradia e investimento.",
};

describe("calculateSeoScore", () => {
  it("retorna 100 para um documento completo", () => {
    const result = calculateSeoScore(completeDocument);

    expect(result).toMatchObject({
      score: 100,
      maxScore: 100,
      percentage: 100,
    });
    expect(result.checks).toHaveLength(6);
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });

  it("identifica conteúdo sem preparação SEO", () => {
    const result = calculateSeoScore({ name: "X", slug: "Slug Inválido" });

    expect(result.score).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.checks.map((check) => check.id)).toEqual([
      "seo-title-length",
      "seo-description-length",
      "editorial-description-length",
      "hero-image",
      "clean-slug",
      "primary-name",
    ]);
  });
});
