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
            publishStatus: 'PUBLISHED',
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

  const overview: EvidenceItem[] = [];
  const lifestyle: EvidenceItem[] = [];
  const mobility: EvidenceItem[] = [];
  const beach: EvidenceItem[] = [];
  const gastronomy: EvidenceItem[] = [];
  const services: EvidenceItem[] = [];
  const leisure: EvidenceItem[] = [];
  const architecture: EvidenceItem[] = [];
  const investment: EvidenceItem[] = [];
  const audience: EvidenceItem[] = [];

  for (const project of neighborhood.projects) {
    const sourceUrl =
      safeSourceUrl(project.sourceUrl);

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

    if (project.developer?.name) {
      architecture.push({
        label: 'Empreendimentos e incorporadoras',
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
      const characteristics: string[] =
        [];

      if (
        project.areaFrom &&
        project.areaTo
      ) {
        characteristics.push(
          `áreas entre ${project.areaFrom.toString()} m² e ${project.areaTo.toString()} m²`,
        );
      } else if (project.areaFrom) {
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

      if (characteristics.length > 0) {
        audience.push({
          label: 'Perfil residencial',
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
        .map((item) => item.name)
        .filter(Boolean);

    if (typologies.length > 0) {
      audience.push({
        label: 'Tipologias disponíveis',
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

    if (amenities.length > 0) {
      leisure.push({
        label: 'Lazer e comodidades',
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

    if (collections.length > 0) {
      lifestyle.push({
        label: 'Perfil da curadoria',
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
      const priceParts: string[] = [];

      if (project.priceFrom) {
        priceParts.push(
          `valor inicial cadastrado de R$ ${Number(
            project.priceFrom,
          ).toLocaleString('pt-BR')}`,
        );
      }

      if (project.priceTo) {
        priceParts.push(
          `valor final cadastrado de R$ ${Number(
            project.priceTo,
          ).toLocaleString('pt-BR')}`,
        );
      }

      investment.push({
        label: 'Faixa comercial cadastrada',
        description:
          `${project.name} possui ${priceParts.join(
            ' e ',
          )}. Valores e disponibilidade estão sujeitos à confirmação.`,
        ...(sourceUrl
          ? { sourceUrl }
          : {}),
      });
    }

    for (const sourceRecord of project.sourceRecords) {
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
          sourceUrl: recordUrl,
        });
      }
    }

    for (const book of project.bookIngestions) {
      const bookUrl =
        safeSourceUrl(book.storageUrl);

      if (
        bookUrl &&
        book.status !== 'ERROR'
      ) {
        overview.push({
          label:
            `Material: ${book.fileName}`,
          description:
            `Material de inteligência associado ao empreendimento ${project.name}.`,
          sourceUrl: bookUrl,
        });
      }
    }
  }

  /*
   * Estes grupos ficam vazios enquanto o banco não tiver
   * fatos confiáveis e específicos sobre esses temas.
   *
   * Isso é intencional: o coletor não deve inventar
   * informações sobre praia, mobilidade, gastronomia
   * ou serviços apenas com base no nome do bairro.
   */
  const existingDescription =
    compactDescription(
      neighborhood.description,
    );

  if (existingDescription) {
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

  if (existingExperience) {
    lifestyle.unshift({
      label:
        `Experiência em ${neighborhood.name}`,
      description:
        existingExperience,
    });
  }

  return {
    name: neighborhood.name,

    city: 'Rio de Janeiro',

    state: 'Rio de Janeiro',

    overview:
      uniqueEvidence(overview),

    lifestyle:
      uniqueEvidence(lifestyle),

    mobility:
      uniqueEvidence(mobility),

    beach:
      uniqueEvidence(beach),

    gastronomy:
      uniqueEvidence(gastronomy),

    services:
      uniqueEvidence(services),

    leisure:
      uniqueEvidence(leisure),

    architecture:
      uniqueEvidence(architecture),

    investment:
      uniqueEvidence(investment),

    audience:
      uniqueEvidence(audience),

    faq: [],

    heroImage:
      neighborhood.heroImage ??
      neighborhood.projects.find(
        (project) =>
          Boolean(project.heroImage),
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
