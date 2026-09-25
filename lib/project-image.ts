// The original catalog reused Parque Studios photos for unrelated projects.
// Those files can only be presented as photographs of Parque Studios.
// Facades below were extracted unchanged from the corresponding client-provided books.
const verifiedBookImages: Record<string, string> = {
  'be-in-rio-prudente-589': '/images/be-in-rio-prudente-589.jpg',
  'be-in-rio-nascimento-silva-387': '/images/be-in-rio-nascimento-silva-387.jpg',
};

export function projectImage(slug: string, ...candidates: Array<string | null | undefined>) {
  return (
    candidates.find((image) => {
      if (!image) return false;
      if (/^\/images\/parque-\d+\.webp$/.test(image)) return slug === 'parque-studios';
      if (image === '/images/vie-01.jpg') return slug === 'vie-ipanema';
      return true;
    }) ?? verifiedBookImages[slug]
  );
}

export function projectImageFromMedia(
  slug: string,
  heroImage: string | null | undefined,
  media: Array<{ kind: string; url: string }>,
) {
  return projectImage(
    slug,
    heroImage,
    ...media
      .filter((item) => item.kind === 'IMAGE' && isPublicImageUrl(item.url))
      .map((item) => item.url),
  );
}

function isPublicImageUrl(url: string) {
  return /^(https?:\/\/|\/(?!\/))/.test(url) && !/\.(?:pdf|mp4|mov|webm)(?:[?#]|$)/i.test(url);
}

export function projectGalleryImages<T extends { kind: string; url: string }>(
  slug: string,
  heroImage: string | null | undefined,
  media: T[],
) {
  const cover = projectImageFromMedia(slug, heroImage, media);
  const seen = new Set<string>();

  return media.filter((item) => {
    if (item.kind !== 'IMAGE' || item.url === cover || seen.has(item.url)) return false;
    if (!isPublicImageUrl(item.url)) return false;
    if (projectImage(slug, item.url) !== item.url) return false;
    seen.add(item.url);
    return true;
  });
}
