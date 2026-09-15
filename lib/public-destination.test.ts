import { describe, expect, it } from "vitest";

import {
  isPublicSiteUrl,
  publicArticleUrl,
  publicProjectUrl,
} from "./public-destination";

describe("public destinations", () => {
  it("creates internal project and article URLs", () => {
    expect(publicProjectUrl("kronos")).toBe(
      "https://www.imoveisdealtopadraorio.com.br/empreendimentos/kronos",
    );
    expect(publicArticleUrl("investir-em-ipanema")).toBe(
      "https://www.imoveisdealtopadraorio.com.br/artigos/investir-em-ipanema",
    );
  });

  it("rejects incorporator destinations", () => {
    expect(isPublicSiteUrl("https://tegraincorporadora.com.br/projeto")).toBe(
      false,
    );
    expect(
      isPublicSiteUrl(
        "https://www.imoveisdealtopadraorio.com.br/empreendimentos/kronos",
      ),
    ).toBe(true);
  });
});
