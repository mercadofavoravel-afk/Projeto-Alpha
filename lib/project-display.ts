import { getProject } from '@/lib/projects';

// These catalog entries have newer facts confirmed against client-provided material.
// The legacy database was seeded before these corrections and may still have old copy.
const verifiedCatalogSlugs = new Set([
  'parque-studios',
  'cronos-barra',
  'be-in-rio-prudente-589',
  'be-in-rio-nascimento-silva-387',
  'be-in-rio-arpoador',
]);

export function projectDisplay(project: {
  slug: string;
  name: string;
  description: string;
  types: string[];
  highlights: string[];
}) {
  const catalog = getProject(project.slug);
  const verified = verifiedCatalogSlugs.has(project.slug) && catalog;
  return {
    name: project.slug === 'cronos-barra' ? (catalog?.name ?? project.name) : project.name,
    description: verified ? catalog.description : project.description,
    types: verified ? catalog.types : project.types.length ? project.types : (catalog?.types ?? []),
    highlights: project.highlights.length ? project.highlights : (catalog?.highlights ?? []),
  };
}
