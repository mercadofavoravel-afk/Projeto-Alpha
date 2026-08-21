import 'server-only';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

import {
  canPublishNeighborhoodEnrichment,
  enrichNeighborhood,
  type NeighborhoodEvidence,
} from '@/lib/neighborhood-enrichment';

export type NeighborhoodEnrichmentStoreResult = {
  ok: boolean;
  neighborhoodId: string;
  neighborhoodSlug: string;
  evidenceCount: number;
  sourceUrls: string[];
  published: boolean;
  message: string;
};

export async function enrichAndStoreNeighborhood(
  neighborhoodId: string,
  evidence: NeighborhoodEvidence,
): Promise<NeighborhoodEnrichmentStoreResult> {
  const neighborhood =
    await db.neighborhood.findUnique({
      where: {
        id: neighborhoodId,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        heroImage: true,
        videoUrl: true,
        videoTitle: true,
      },
    });

  if (!neighborhood) {
    throw new Error(
      'Bairro não encontrado.',
    );
  }

  const enrichment =
    enrichNeighborhood({
      ...evidence,
      name: neighborhood.name,

      heroImage:
        evidence.heroImage ??
        neighborhood.heroImage,

      videoUrl:
        evidence.videoUrl ??
        neighborhood.videoUrl,

      videoTitle:
        evidence.videoTitle ??
        neighborhood.videoTitle,
    });

  const publishable =
    canPublishNeighborhoodEnrichment(
      enrichment,
    );

  if (!publishable) {
    return {
      ok: false,
      neighborhoodId:
        neighborhood.id,
      neighborhoodSlug:
        neighborhood.slug,
      evidenceCount:
        enrichment.evidenceCount,
      sourceUrls:
        enrichment.sourceUrls,
      published: false,
      message:
        'As fontes ainda não possuem evidências suficientes para atualizar automaticamente este bairro.',
    };
  }

  await db.neighborhood.update({
    where: {
      id: neighborhood.id,
    },

    data: {
      description:
        enrichment.description,

      experienceTitle:
        enrichment.experienceTitle,

      experienceDescription:
        enrichment.experienceDescription,

      highlights:
        enrichment.highlights,

      videoUrl:
        enrichment.videoUrl,

      videoTitle:
        enrichment.videoTitle,

      ctaTitle:
        enrichment.ctaTitle,

      ctaDescription:
        enrichment.ctaDescription,

      faq:
        enrichment.faq,

      seoTitle:
        enrichment.seoTitle,

      seoDescription:
        enrichment.seoDescription,

      heroImage:
        enrichment.heroImage ??
        neighborhood.heroImage,
    },
  });

  revalidatePath('/bairros');

  revalidatePath(
    `/bairros/${neighborhood.slug}`,
  );

  revalidatePath('/admin/bairros');

  revalidatePath(
    `/admin/bairros/${neighborhood.id}`,
  );

  return {
    ok: true,
    neighborhoodId:
      neighborhood.id,
    neighborhoodSlug:
      neighborhood.slug,
    evidenceCount:
      enrichment.evidenceCount,
    sourceUrls:
      enrichment.sourceUrls,
    published: true,
    message:
      'Conteúdo editorial do bairro atualizado com sucesso.',
  };
}
