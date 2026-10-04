const MAX_SOURCE_LENGTH = 120;

function cleanSegment(value: string) {
  return value.replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
}

export function createContentLeadSource({ content, region }: { content: string; region: string }) {
  const prefix = 'Conteúdo | conteúdo: ';
  const normalizedRegion = cleanSegment(region);
  const regionSegment = normalizedRegion ? ` | região: ${normalizedRegion}` : '';
  const availableContentLength = Math.max(
    0,
    MAX_SOURCE_LENGTH - prefix.length - regionSegment.length,
  );

  return `${prefix}${cleanSegment(content).slice(0, availableContentLength)}${regionSegment}`;
}

export function contentFromSource(source: string | null | undefined) {
  // Older records used "Orgânico" for the page of origin even when the traffic channel was unknown.
  const match = source?.match(
    /^(?:Conteúdo|Orgânico) \| (?:conteúdo|artigo): (.+?)(?: \| região:|$)/,
  );
  return match?.[1] || null;
}

export function isArticleSource(source: string | null | undefined) {
  return /^(?:Conteúdo|Orgânico) \| artigo:/u.test(source ?? '');
}
