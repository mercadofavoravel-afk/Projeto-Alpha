import 'server-only';

import { z } from 'zod';

const evidenceItemSchema = z.object({
  label: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(800),
  sourceUrl: z.string().url().optional(),
});

const faqEvidenceSchema = z.object({
  question: z.string().trim().min(5).max(220),
  answer: z.string().trim().min(10).max(1200),
  sourceUrl: z.string().url().optional(),
});

const neighborhoodEvidenceSchema = z.object({
  name: z.string().trim().min(2).max(120),

  city: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .default('Rio de Janeiro'),

  state: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .default('Rio de Janeiro'),

  overview: z
    .array(evidenceItemSchema)
    .default([]),

  lifestyle: z
    .array(evidenceItemSchema)
    .default([]),

  mobility: z
    .array(evidenceItemSchema)
    .default([]),

  beach: z
    .array(evidenceItemSchema)
    .default([]),

  gastronomy: z
    .array(evidenceItemSchema)
    .default([]),

  services: z
    .array(evidenceItemSchema)
    .default([]),

  leisure: z
    .array(evidenceItemSchema)
    .default([]),

  architecture: z
    .array(evidenceItemSchema)
    .default([]),

  investment: z
    .array(evidenceItemSchema)
    .default([]),

  audience: z
    .array(evidenceItemSchema)
    .default([]),

  faq: z
    .array(faqEvidenceSchema)
    .default([]),

  heroImage: z
    .string()
    .trim()
    .optional()
    .nullable(),

  videoUrl: z
    .string()
    .trim()
    .optional()
    .nullable(),

  videoTitle: z
    .string()
    .trim()
    .optional()
    .nullable(),
});

export type NeighborhoodEvidence =
  z.input<typeof neighborhoodEvidenceSchema>;

export type NeighborhoodHighlight = {
  title: string;
  description: string;
};

export type NeighborhoodFaq = {
  question: string;
  answer: string;
};

export type NeighborhoodEnrichment = {
  name: string;
  description: string;
  experienceTitle: string;
  experienceDescription: string;
  highlights: NeighborhoodHighlight[];
  videoUrl: string | null;
  videoTitle: string | null;
  ctaTitle: string;
  ctaDescription: string;
  faq: NeighborhoodFaq[];
  seoTitle: string;
  seoDescription: string;
  heroImage: string | null;
  sourceUrls: string[];
  evidenceCount: number;
};

function cleanWhitespace(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .trim();
}

function sentence(value: string) {
  const cleaned = cleanWhitespace(value);

  if (!cleaned) {
    return '';
  }

  return /[.!?]$/.test(cleaned)
    ? cleaned
    : `${cleaned}.`;
}

function unique<T>(
  items: T[],
  key: (item: T) => string,
) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const value = key(item)
      .trim()
      .toLocaleLowerCase('pt-BR');

    if (!value || seen.has(value)) {
      return false;
    }

    seen.add(value);

    return true;
  });
}

function limitText(
  value: string,
  maxLength: number,
) {
  const cleaned = cleanWhitespace(value);

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  const shortened = cleaned
    .slice(0, maxLength - 1)
    .trimEnd();

  const lastSpace =
    shortened.lastIndexOf(' ');

  const safe =
    lastSpace > maxLength * 0.65
      ? shortened.slice(0, lastSpace)
      : shortened;

  return `${safe.trim()}.`;
}

function collectDescriptions(
  groups: Array<
    Array<z.infer<typeof evidenceItemSchema>>
  >,
) {
  return unique(
    groups.flat(),
    (item) => item.description,
  );
}

function collectSourceUrls(
  parsed: z.infer<
    typeof neighborhoodEvidenceSchema
  >,
) {
  const groups = [
    parsed.overview,
    parsed.lifestyle,
    parsed.mobility,
    parsed.beach,
    parsed.gastronomy,
    parsed.services,
    parsed.leisure,
    parsed.architecture,
    parsed.investment,
    parsed.audience,
  ];

  const urls = [
    ...groups
      .flat()
      .map((item) => item.sourceUrl)
      .filter(
        (value): value is string =>
          Boolean(value),
      ),

    ...parsed.faq
      .map((item) => item.sourceUrl)
      .filter(
        (value): value is string =>
          Boolean(value),
      ),
  ];

  return [
    ...new Set(urls),
  ];
}

function buildDescription(
  parsed: z.infer<
    typeof neighborhoodEvidenceSchema
  >,
) {
  const evidence = collectDescriptions([
    parsed.overview,
    parsed.lifestyle,
    parsed.architecture,
  ]);

  if (evidence.length === 0) {
    return (
      `${parsed.name} integra a curadoria territorial ` +
      `do Alpha no Rio de Janeiro. Esta página reúne ` +
      `empreendimentos publicados, informações locais ` +
      `e oportunidades acompanhadas pela plataforma.`
    );
  }

  const selected = evidence
    .slice(0, 2)
    .map((item) =>
      sentence(item.description),
    )
    .join(' ');

  return limitText(
    selected,
    520,
  );
}

function buildExperienceDescription(
  parsed: z.infer<
    typeof neighborhoodEvidenceSchema
  >,
) {
  const evidence = collectDescriptions([
    parsed.lifestyle,
    parsed.beach,
    parsed.gastronomy,
    parsed.services,
    parsed.mobility,
    parsed.leisure,
  ]);

  if (evidence.length === 0) {
    return (
      `Conhecer ${parsed.name} vai além de localizar ` +
      `um imóvel no mapa. A curadoria do Alpha reúne ` +
      `informações verificadas sobre a região para ajudar ` +
      `o comprador a compreender melhor o cotidiano, ` +
      `a localização e o perfil das oportunidades disponíveis.`
    );
  }

  return limitText(
    evidence
      .slice(0, 5)
      .map((item) =>
        sentence(item.description),
      )
      .join(' '),
    1400,
  );
}

function buildHighlights(
  parsed: z.infer<
    typeof neighborhoodEvidenceSchema
  >,
): NeighborhoodHighlight[] {
  const candidates = [
    ...parsed.beach,
    ...parsed.lifestyle,
    ...parsed.gastronomy,
    ...parsed.mobility,
    ...parsed.services,
    ...parsed.leisure,
    ...parsed.architecture,
  ];

  return unique(
    candidates,
    (item) => item.label,
  )
    .slice(0, 6)
    .map((item) => ({
      title: item.label,
      description: limitText(
        item.description,
        300,
      ),
    }));
}

function buildFaq(
  parsed: z.infer<
    typeof neighborhoodEvidenceSchema
  >,
): NeighborhoodFaq[] {
  if (parsed.faq.length > 0) {
    return unique(
      parsed.faq,
      (item) => item.question,
    )
      .slice(0, 8)
      .map((item) => ({
        question: item.question,
        answer: limitText(
          item.answer,
          1000,
        ),
      }));
  }

  const generated: NeighborhoodFaq[] =
    [];

  const lifestyle =
    parsed.lifestyle[0];

  if (lifestyle) {
    generated.push({
      question:
        `Como é viver em ${parsed.name}?`,
      answer: limitText(
        lifestyle.description,
        900,
      ),
    });
  }

  const mobility =
    parsed.mobility[0];

  if (mobility) {
    generated.push({
      question:
        `Como é a mobilidade em ${parsed.name}?`,
      answer: limitText(
        mobility.description,
        900,
      ),
    });
  }

  const investment =
    parsed.investment[0];

  if (investment) {
    generated.push({
      question:
        `O que considerar ao avaliar um imóvel em ${parsed.name}?`,
      answer: limitText(
        investment.description,
        900,
      ),
    });
  }

  return generated;
}

function buildSeoTitle(name: string) {
  return limitText(
    `Imóveis de alto padrão em ${name} | Rio de Janeiro`,
    70,
  );
}

function buildSeoDescription(
  parsed: z.infer<
    typeof neighborhoodEvidenceSchema
  >,
) {
  const firstUsefulEvidence =
    parsed.overview[0] ??
    parsed.lifestyle[0] ??
    parsed.architecture[0];

  if (firstUsefulEvidence) {
    return limitText(
      `Conheça imóveis de alto padrão em ${parsed.name}, Rio de Janeiro. ${firstUsefulEvidence.description}`,
      180,
    );
  }

  return limitText(
    `Conheça imóveis, empreendimentos e a experiência de viver em ${parsed.name}, no Rio de Janeiro, com a curadoria imobiliária do Alpha.`,
    180,
  );
}

function buildCtaDescription(
  parsed: z.infer<
    typeof neighborhoodEvidenceSchema
  >,
) {
  const audience =
    parsed.audience[0];

  if (audience) {
    return limitText(
      `Conte à nossa equipe o que você procura. ${sentence(
        audience.description,
      )} A partir do seu perfil, podemos preparar uma seleção reservada de oportunidades na região.`,
      520,
    );
  }

  return (
    `Conte à nossa equipe o que você procura, sua faixa ` +
    `de investimento e seu objetivo. A partir dessas ` +
    `informações, podemos preparar uma seleção reservada ` +
    `de oportunidades em ${parsed.name}.`
  );
}

export function enrichNeighborhood(
  input: NeighborhoodEvidence,
): NeighborhoodEnrichment {
  const parsed =
    neighborhoodEvidenceSchema.parse(
      input,
    );

  const sourceUrls =
    collectSourceUrls(parsed);

  const evidenceCount =
    parsed.overview.length +
    parsed.lifestyle.length +
    parsed.mobility.length +
    parsed.beach.length +
    parsed.gastronomy.length +
    parsed.services.length +
    parsed.leisure.length +
    parsed.architecture.length +
    parsed.investment.length +
    parsed.audience.length +
    parsed.faq.length;

  return {
    name: parsed.name,

    description:
      buildDescription(parsed),

    experienceTitle:
      `Como é viver em ${parsed.name}`,

    experienceDescription:
      buildExperienceDescription(
        parsed,
      ),

    highlights:
      buildHighlights(parsed),

    videoUrl:
      parsed.videoUrl ?? null,

    videoTitle:
      parsed.videoTitle ??
      (parsed.videoUrl
        ? `Conheça ${parsed.name}`
        : null),

    ctaTitle:
      `Encontre o imóvel certo em ${parsed.name}.`,

    ctaDescription:
      buildCtaDescription(parsed),

    faq:
      buildFaq(parsed),

    seoTitle:
      buildSeoTitle(parsed.name),

    seoDescription:
      buildSeoDescription(parsed),

    heroImage:
      parsed.heroImage ?? null,

    sourceUrls,

    evidenceCount,
  };
}

export function canPublishNeighborhoodEnrichment(
  enrichment: NeighborhoodEnrichment,
) {
  return (
    enrichment.evidenceCount >= 3 &&
    enrichment.description.length >= 80 &&
    enrichment.experienceDescription
      .length >= 120
  );
}
