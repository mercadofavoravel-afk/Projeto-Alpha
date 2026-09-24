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
