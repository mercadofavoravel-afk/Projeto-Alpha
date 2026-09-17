const MAX_SOURCE_LENGTH = 120;

function cleanSegment(value: string) {
  return value
    .replace(/\|/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createOrganicLeadSource({
  content,
  region,
}: {
  content: string;
  region: string;
}) {
  const prefix = 'Orgânico | conteúdo: ';
  const normalizedRegion = cleanSegment(region);
  const regionSegment = normalizedRegion
    ? ` | região: ${normalizedRegion}`
    : '';
  const availableContentLength = Math.max(
    0,
    MAX_SOURCE_LENGTH - prefix.length - regionSegment.length,
  );

  return `${prefix}${cleanSegment(content).slice(0, availableContentLength)}${regionSegment}`;
}
