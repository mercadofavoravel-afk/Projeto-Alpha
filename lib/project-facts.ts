// Fallbacks are used only when a published project has no structured area in the CMS.
// VIE and Bruma: existing catalog descriptions in data/projects.json.
// Stay 360: developer's project page, https://arosinc.com.br/stay360-leblon-lp/.
// Parque Studios: ficha técnica, página 41 do Book Digital Parque Studios fornecido pelo cliente.
// Prudente 589 and Nascimento Silva 387: their respective client-supplied digital books.
// Kronos Barra: client-supplied kronos_barra_versao_web (1).html.
// Arpoador: project listing printed in the client-supplied Nascimento Silva 387 book.
// Copacabana: developer's project page, https://www.be-in-rio.com.br/praiacopacabana/.
// Soul Rio: Monza's project page, https://monzainc.com.br/empreendimentos/gago-coutinho-53.
// Paradís: Mozak's project page, https://mozak.rio/projetos/disponiveis/paradis/.
// Green Park, Pompeu and Guilhem: project listings on the client's own website.
const confirmedAreas: Record<string, [number, number]> = {
  'vie-ipanema': [407, 565],
  'bruma-mozak': [225, 410],
  'stay-360-leblon': [28, 50],
  'parque-studios': [35, 66],
  'be-in-rio-prudente-589': [38.07, 83.45],
  'be-in-rio-nascimento-silva-387': [36.5, 75.16],
  'cronos-barra': [77, 301],
  'be-in-rio-arpoador': [43.1, 92.11],
  'be-in-rio-copacabana': [37.12, 153.24],
  'soul-rio-gago-coutinho': [27.81, 82.65],
  'paradis-mozak': [62, 147],
  'green-park': [64, 265],
  'be-in-rio-pompeu': [30, 80.01],
  'guilherm-mozak': [29, 77],
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

  if (slug === 'stay-360-leblon' && areaFrom == null && areaTo == null) {
    return `${formatArea(minimum)} a ${formatArea(maximum)} m² (studios e gardens)`;
  }

  return `${formatArea(minimum)} a ${formatArea(maximum)} m²`;
}

export function projectRoomLabel(from?: number | null, to?: number | null, unit = 'quarto') {
  const minimum = from ?? to;
  const maximum = to ?? from;
  if (minimum == null || maximum == null) return null;
  if (minimum === maximum) return `${minimum} ${minimum === 1 ? unit : `${unit}s`}`;
  return `${minimum} a ${maximum} ${unit}s`;
}
