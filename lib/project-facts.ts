// Fallbacks are used only when a published project has no structured area in the CMS.
// VIE and Bruma: existing catalog descriptions in data/projects.json.
// Stay 360: developer's project page, https://arosinc.com.br/stay360-leblon-lp/.
const confirmedAreas: Record<string, [number, number]> = {
  'vie-ipanema': [407, 565],
  'bruma-mozak': [225, 410],
  'stay-360-leblon': [28, 50],
};

function formatArea(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
}

export function projectAreaLabel(
  slug: string,
  areaFrom?: number | null,
  areaTo?: number | null,
) {
  const [minimum, maximum] =
    areaFrom != null || areaTo != null
      ? [areaFrom ?? areaTo, areaTo ?? areaFrom]
      : (confirmedAreas[slug] ?? []);

  if (minimum == null || maximum == null) return null;
  if (minimum === maximum) return `${formatArea(minimum)} m²`;

  return `${formatArea(minimum)} a ${formatArea(maximum)} m²`;
}

export function projectRoomLabel(from?: number | null, to?: number | null, unit = 'quarto') {
  const minimum = from ?? to;
  const maximum = to ?? from;
  if (minimum == null || maximum == null) return null;
  if (minimum === maximum) return `${minimum} ${minimum === 1 ? unit : `${unit}s`}`;
  return `${minimum} a ${maximum} ${unit}s`;
}
