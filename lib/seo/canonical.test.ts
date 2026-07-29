import { afterEach, describe, expect, it } from "vitest";
import { buildCanonical, getSiteUrl } from "./canonical";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe("buildCanonical", () => {
  it("normaliza domínio, barras e caminho", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://alpha.example.com///";

    expect(getSiteUrl()).toBe("https://alpha.example.com");
    expect(buildCanonical("//empreendimentos///vista-mar/")).toBe(
      "https://alpha.example.com/empreendimentos/vista-mar",
    );
  });

  it("retorna a raiz com uma barra final", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://alpha.example.com";
    expect(buildCanonical("/")).toBe("https://alpha.example.com/");
  });
});
