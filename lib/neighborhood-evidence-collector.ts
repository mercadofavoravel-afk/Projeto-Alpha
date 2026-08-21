import 'server-only';

import { db } from '@/lib/db';
import type { NeighborhoodEvidence } from '@/lib/neighborhood-enrichment';

type EvidenceItem = {
  label: string;
  description: string;
  sourceUrl?: string;
};

function safeSourceUrl(
  value?: string | null,
) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    ) {
      return url.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function uniqueEvidence(
  items: EvidenceItem[],
) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.label}|${item.description}`
      .trim()
      .toLocaleLowerCase('pt-BR');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

function compactDescription(
  value?: string | null,
  maxLength = 760,
) {
  if (!value) {
    return null;
  }

  const cleaned = value
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return null;
  }

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned
    .slice(0, maxLength - 1)
    .trim()}…`;
}

function extractedText(
  value: unknown,
) {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return '';
  }

  if (
    'text' in value &&
    typeof value.text === 'string'
  ) {
    return value.text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  return '';
}

function normalizeForSearch(
  value: string,
) {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLocaleLowerCase('pt-BR');
}

function splitIntoEvidenceChunks(
  text: string,
) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) =>
      part
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(
      (part) => part.length >= 60,
    );

  const chunks: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= 700) {
      chunks.push(paragraph);
      continue;
    }

    const sentences =
      paragraph
        .split(
          /(?<=[.!?])\s+/,
        )
        .map((part) =>
          part.trim(),
        )
        .filter(Boolean);

    let current = '';

    for (const sentence of sentences) {
      const candidate =
        current
          ? `${current} ${sentence}`
          : sentence;

      if (
        candidate.length > 700 &&
        current
      ) {
        chunks.push(current);
        current = sentence;
      } else {
        current = candidate;
      }
    }

    if (current) {
      chunks.push(current);
    }
  }

  return chunks.slice(0, 120);
}

function containsAny(
  text: string,
  terms: string[],
) {
  const normalized =
    normalizeForSearch(text);

  return terms.some((term) =>
    normalized.includes(
      normalizeForSearch(term),
    ),
  );
}

function pushBookEvidence(
  chunk: string,
  sourceUrl: string | undefined,
  projectName: string,
  neighborhoodName: string,
  groups: {
    overview: EvidenceItem[];
    lifestyle: EvidenceItem[];
    mobility: EvidenceItem[];
    beach: EvidenceItem[];
    gastronomy: EvidenceItem[];
    services: EvidenceItem[];
    leisure: EvidenceItem[];
    architecture: EvidenceItem[];
    investment: EvidenceItem[];
    audience: EvidenceItem[];
  },
) {
  const neighborhoodMention =
    containsAny(chunk, [
      neighborhoodName,
    ]);

  const projectMention =
    containsAny(chunk, [
      projectName,
    ]);

  /*
   * Só aproveitamos um trecho quando ele menciona
   * explicitamente o bairro ou o empreendimento
   * ao qual o material está vinculado.
   */
  if (
    !neighborhoodMention &&
    !projectMention
  ) {
    return;
  }

  const evidence = {
    description: chunk,
    ...(sourceUrl
      ? { sourceUrl }
      : {}),
  };

  const classified: Array<
    keyof typeof groups
  > = [];

  if (
    containsAny(chunk, [
      'praia',
      'orla',
      'mar',
      'beira-mar',
      'beira mar',
      'oceano',
    ])
  ) {
    groups.beach.push({
      label: 'Praia e orla',
      ...evidence,
    });

    classified.push('beach');
  }

  if (
    containsAny(chunk, [
      'restaurante',
      'restaurantes',
      'gastronomia',
      'gastronômico',
      'gastronomico',
      'café',
      'cafés',
      'bares',
      'bar',
    ])
  ) {
    groups.gastronomy.push({
      label: 'Gastronomia',
      ...evidence,
    });

    classified.push(
      'gastronomy',
    );
  }

  if (
    containsAny(chunk, [
      'metrô',
      'metro',
      'mobilidade',
      'acesso',
      'transporte',
      'deslocamento',
      'avenida',
      'rua',
      'ciclovia',
    ])
  ) {
    groups.mobility.push({
      label: 'Mobilidade e acesso',
      ...evidence,
    });

    classified.push(
      'mobility',
    );
  }

  if (
    containsAny(chunk, [
      'shopping',
      'mercado',
      'supermercado',
      'farmácia',
      'farmacia',
      'hospital',
      'clínica',
      'clinica',
      'escola',
      'colégio',
      'colegio',
      'serviço',
      'servico',
      'serviços',
      'servicos',
    ])
  ) {
    groups.services.push({
      label: 'Serviços e conveniência',
      ...evidence,
    });

    classified.push(
      'services',
    );
  }

  if (
    containsAny(chunk, [
      'lazer',
      'parque',
      'praça',
      'praca',
      'clube',
      'academia',
      'esporte',
      'cultura',
      'teatro',
      'cinema',
      'museu',
    ])
  ) {
    groups.leisure.push({
      label: 'Lazer e cultura',
      ...evidence,
    });

    classified.push(
      'leisure',
    );
  }

  if (
    containsAny(chunk, [
      'arquitetura',
      'arquitetônico',
      'arquitetonico',
      'fachada',
      'design',
      'projeto',
      'paisagismo',
      'contemporâneo',
      'contemporaneo',
    ])
  ) {
    groups.architecture.push({
      label: 'Arquitetura e desenho urbano',
      ...evidence,
    });

    classified.push(
      'architecture',
    );
  }

  if (
    containsAny(chunk, [
      'investimento',
      'investidor',
      'valorização',
      'valorizacao',
      'patrimônio',
      'patrimonio',
      'liquidez',
      'rentabilidade',
      'preço',
      'preco',
      'valor',
      'm²',
      'metro quadrado',
    ])
  ) {
    groups.investment.push({
      label: 'Mercado e patrimônio',
      ...evidence,
    });

    classified.push(
      'investment',
    );
  }

  if (
    containsAny(chunk, [
      'morar',
      'moradia',
      'residencial',
      'família',
      'familia',
      'perfil',
      'estilo de vida',
      'lifestyle',
      'cotidiano',
      'qualidade de vida',
    ])
  ) {
    groups.lifestyle.push({
      label: 'Estilo de vida',
      ...evidence,
    });

    classified.push(
      'lifestyle',
    );
  }

  if (
    containsAny(chunk, [
      'quarto',
      'quartos',
      'suíte',
      'suite',
      'suítes',
      'suites',
      'tipologia',
      'tipologias',
      'planta',
      'plantas',
      'área',
      'area',
      'm²',
    ])
  ) {
    groups.audience.push({
      label: 'Perfil residencial',
      ...evidence,
    });

    classified.push(
      'audience',
    );
  }

  if (
    classified.length === 0
  ) {
    groups.overview.push({
      label: `Inteligência sobre ${neighborhoodName}`,
      ...evidence,
    });
  }
}

export async function collectNeighborhoodEvidence(
  neighborhoodId: string,
): Promise<NeighborhoodEvidence> {
  const neighborhood =
    await db.neighborhood.findUnique({
      where: {
        id: neighborhoodId,
      },

      include: {
        projects: {
          where: {
            publishStatus:
              'PUBLISHED',
          },

          include: {
            developer: true,

            typologies: true,

            amenities: {
              include: {
                amenity: true,
              },
            },

            collections: {
              include: {
                collection: true,
              },
            },

            sourceRecords: true,

            bookIngestions: true,
          },

          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    });

  if (!neighborhood) {
    throw new Error(
      'Bairro não encontrado.',
    );
  }

  const overview:
    EvidenceItem[] = [];

  const lifestyle:
    EvidenceItem[] = [];

  const mobility:
    EvidenceItem[] = [];

  const beach:
    EvidenceItem[] = [];

  const gastronomy:
    EvidenceItem[] = [];

  const services:
    EvidenceItem[] = [];

  const leisure:
    EvidenceItem[] = [];

  const architecture:
    EvidenceItem[] = [];

  const investment:
    EvidenceItem[] = [];

  const audience:
    EvidenceItem[] = [];

  const groups = {
    overview,
    lifestyle,
    mobility,
    beach,
    gastronomy,
    services,
    leisure,
    architecture,
    investment,
    audience,
  };

  for (
    const project of
    neighborhood.projects
  ) {
    const sourceUrl =
      safeSourceUrl(
        project.sourceUrl,
      );

    const description =
      compactDescription(
        project.description,
      );

    if (description) {
      overview.push({
        label: project.name,
        description,
        ...(sourceUrl
          ? { sourceUrl }
          : {}),
      });
    }

    if (
      project.developer?.name
    ) {
      architecture.push({
        label:
          'Empreendimentos e incorporadoras',

        description:
          `${project.name} é um empreendimento associado à incorporadora ${project.developer.name}.`,

        ...(sourceUrl
          ? { sourceUrl }
          : {}),
      });
    }

    if (
      project.areaFrom ||
      project.areaTo ||
      project.bedroomsFrom ||
      project.bedroomsTo ||
      project.suitesFrom ||
      project.suitesTo
    ) {
      const characteristics:
        string[] = [];

      if (
        project.areaFrom &&
        project.areaTo
      ) {
        characteristics.push(
          `áreas entre ${project.areaFrom.toString()} m² e ${project.areaTo.toString()} m²`,
        );
      } else if (
        project.areaFrom
      ) {
        characteristics.push(
          `áreas a partir de ${project.areaFrom.toString()} m²`,
        );
      }

      if (
        project.bedroomsFrom &&
        project.bedroomsTo
      ) {
        characteristics.push(
          `${project.bedroomsFrom} a ${project.bedroomsTo} quartos`,
        );
      } else if (
        project.bedroomsFrom
      ) {
        characteristics.push(
          `a partir de ${project.bedroomsFrom} quartos`,
        );
      }

      if (
        project.suitesFrom &&
        project.suitesTo
      ) {
        characteristics.push(
          `${project.suitesFrom} a ${project.suitesTo} suítes`,
        );
      }

      if (
        characteristics.length >
        0
      ) {
        audience.push({
          label:
            'Perfil residencial',

          description:
            `${project.name} apresenta ${characteristics.join(
              ', ',
            )}.`,

          ...(sourceUrl
            ? { sourceUrl }
            : {}),
        });
      }
    }

    const typologies =
      project.typologies
        .map(
          (item) => item.name,
        )
        .filter(Boolean);

    if (
      typologies.length > 0
    ) {
      audience.push({
        label:
          'Tipologias disponíveis',

        description:
          `${project.name} possui tipologias como ${typologies.join(
            ', ',
          )}.`,

        ...(sourceUrl
          ? { sourceUrl }
          : {}),
      });
    }

    const amenities =
      project.amenities
        .map(
          (item) =>
            item.amenity.name,
        )
        .filter(Boolean);

    if (
      amenities.length > 0
    ) {
      leisure.push({
        label:
          'Lazer e comodidades',

        description:
          `${project.name} reúne comodidades como ${amenities
            .slice(0, 8)
            .join(', ')}.`,

        ...(sourceUrl
          ? { sourceUrl }
          : {}),
      });
    }

    const collections =
      project.collections
        .map(
          (item) =>
            item.collection.name,
        )
        .filter(Boolean);

    if (
      collections.length > 0
    ) {
      lifestyle.push({
        label:
          'Perfil da curadoria',

        description:
          `${project.name} integra as seleções ${collections.join(
            ', ',
          )}.`,

        ...(sourceUrl
          ? { sourceUrl }
          : {}),
      });
    }

    if (
      project.priceFrom ||
      project.priceTo
    ) {
      const priceParts:
        string[] = [];

      if (
        project.priceFrom
      ) {
        priceParts.push(
          `valor inicial cadastrado de R$ ${Number(
            project.priceFrom,
          ).toLocaleString(
            'pt-BR',
          )}`,
        );
      }

      if (
        project.priceTo
      ) {
        priceParts.push(
          `valor final cadastrado de R$ ${Number(
            project.priceTo,
          ).toLocaleString(
            'pt-BR',
          )}`,
        );
      }

      investment.push({
        label:
          'Faixa comercial cadastrada',

        description:
          `${project.name} possui ${priceParts.join(
            ' e ',
          )}. Valores e disponibilidade estão sujeitos à confirmação.`,

        ...(sourceUrl
          ? { sourceUrl }
          : {}),
      });
    }

    for (
      const sourceRecord of
      project.sourceRecords
    ) {
      const recordUrl =
        safeSourceUrl(
          sourceRecord.storageUrl,
        );

      if (
        sourceRecord.title &&
        recordUrl
      ) {
        overview.push({
          label:
            `Fonte: ${sourceRecord.title}`,

          description:
            `Material de referência associado ao empreendimento ${project.name}.`,

          sourceUrl:
            recordUrl,
        });
      }
    }

    for (
      const book of
      project.bookIngestions
    ) {
      const bookUrl =
        safeSourceUrl(
          book.storageUrl,
        );

      const text =
        extractedText(
          book.extracted,
        );

      /*
       * Aqui está a mudança principal:
       * quando o Book está processado e possui texto,
       * o Alpha passa a analisar o conteúdo real.
       */
      if (
        book.status ===
          'COMPLETED' &&
        text.length >= 80
      ) {
        const chunks =
          splitIntoEvidenceChunks(
            text,
          );

        for (
          const chunk of chunks
        ) {
          pushBookEvidence(
            chunk,
            bookUrl,
            project.name,
            neighborhood.name,
            groups,
          );
        }

        continue;
      }

      /*
       * Se ainda não houver texto extraído,
       * mantemos apenas o registro da existência
       * do material. Isso não é tratado como fato
       * de lifestyle, mercado ou localização.
       */
      if (
        bookUrl &&
        book.status !==
          'FAILED'
      ) {
        overview.push({
          label:
            `Material: ${book.fileName}`,

          description:
            `Material de inteligência associado ao empreendimento ${project.name}.`,

          sourceUrl:
            bookUrl,
        });
      }
    }
  }

  const existingDescription =
    compactDescription(
      neighborhood.description,
    );

  if (
    existingDescription
  ) {
    overview.unshift({
      label:
        `Visão geral de ${neighborhood.name}`,

      description:
        existingDescription,
    });
  }

  const existingExperience =
    compactDescription(
      neighborhood.experienceDescription,
    );

  if (
    existingExperience
  ) {
    lifestyle.unshift({
      label:
        `Experiência em ${neighborhood.name}`,

      description:
        existingExperience,
    });
  }

  return {
    name:
      neighborhood.name,

    city:
      'Rio de Janeiro',

    state:
      'Rio de Janeiro',

    overview:
      uniqueEvidence(
        overview,
      ),

    lifestyle:
      uniqueEvidence(
        lifestyle,
      ),

    mobility:
      uniqueEvidence(
        mobility,
      ),

    beach:
      uniqueEvidence(
        beach,
      ),

    gastronomy:
      uniqueEvidence(
        gastronomy,
      ),

    services:
      uniqueEvidence(
        services,
      ),

    leisure:
      uniqueEvidence(
        leisure,
      ),

    architecture:
      uniqueEvidence(
        architecture,
      ),

    investment:
      uniqueEvidence(
        investment,
      ),

    audience:
      uniqueEvidence(
        audience,
      ),

    faq: [],

    heroImage:
      neighborhood.heroImage ??
      neighborhood.projects.find(
        (project) =>
          Boolean(
            project.heroImage,
          ),
      )?.heroImage ??
      null,

    videoUrl:
      neighborhood.videoUrl ??
      null,

    videoTitle:
      neighborhood.videoTitle ??
      null,
  };
}
