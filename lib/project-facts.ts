// Fallbacks are used only when a published project has no structured area in the CMS.
// VIE and Bruma: existing catalog descriptions in data/projects.json.
// Stay 360: developer's project page, https://arosinc.com.br/stay360-leblon-lp/.
// Parque Studios: ficha técnica, página 41 do Book Digital Parque Studios fornecido pelo cliente.
const confirmedAreas: Record<string, [number, number]> = {
  'vie-ipanema': [407, 565],
  'bruma-mozak': [225, 410],
  'stay-360-leblon': [28, 50],
  'parque-studios': [35, 66],
};

// Ranges transcribed from the existing catalog descriptions in data/projects.json.
const confirmedBedrooms: Record<string, [number, number]> = {
  'cronos-barra': [2, 4],
  'bennett-flamengo': [2, 3],
  'green-park': [2, 3],
  'paradis-mozak': [2, 3],
};

const confirmedSuites: Record<string, [number, number]> = {
  'bruma-mozak': [4, 5],
};

export function projectBedrooms(slug: string, from?: number | null, to?: number | null) {
  const [minimum, maximum] =
    from != null || to != null ? [from, to] : (confirmedBedrooms[slug] ?? []);
  return projectRoomLabel(minimum, maximum);
}

export function projectSuites(slug: string, from?: number | null, to?: number | null) {
  const [minimum, maximum] =
    from != null || to != null ? [from, to] : (confirmedSuites[slug] ?? []);
  return projectRoomLabel(minimum, maximum, 'suíte');
}

function formatArea(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
}

export function projectAreaLabel(slug: string, areaFrom?: number | null, areaTo?: number | null) {
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
