// The original catalog reused Parque Studios photos for unrelated projects.
// Those files can only be presented as photographs of Parque Studios.
export function projectImage(slug: string, ...candidates: Array<string | null | undefined>) {
  return candidates.find((image) => {
    if (!image) return false;
    if (/^\/images\/parque-\d+\.webp$/.test(image)) return slug === 'parque-studios';
    if (image === '/images/vie-01.jpg') return slug === 'vie-ipanema';
    return true;
  });
}
