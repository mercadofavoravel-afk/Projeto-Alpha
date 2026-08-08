import type { SeoRule } from './types';

function between(value: string | null | undefined, min: number, max: number) {
  const length = value?.trim().length ?? 0;
  return length >= min && length <= max;
}

export const seoRules: readonly SeoRule[] = [
  {
    id: 'seo-title-length',
    label: 'Título SEO entre 30 e 60 caracteres',
    points: 20,
    validate: (document) => between(document.seoTitle, 30, 60),
  },
  {
    id: 'seo-description-length',
    label: 'Descrição SEO entre 120 e 160 caracteres',
    points: 20,
    validate: (document) => between(document.seoDescription, 120, 160),
  },
  {
    id: 'editorial-description-length',
    label: 'Descrição editorial com pelo menos 120 caracteres',
    points: 20,
    validate: (document) => (document.description?.trim().length ?? 0) >= 120,
  },
  {
    id: 'hero-image',
    label: 'Imagem principal cadastrada',
    points: 15,
    validate: (document) => Boolean(document.heroImage?.trim()),
  },
  {
    id: 'clean-slug',
    label: 'Slug limpo e legível',
    points: 15,
    validate: (document) =>
      Boolean(document.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(document.slug)),
  },
  {
    id: 'primary-name',
    label: 'Nome principal cadastrado',
    points: 10,
    validate: (document) => (document.name?.trim().length ?? 0) >= 3,
  },
] as const;
