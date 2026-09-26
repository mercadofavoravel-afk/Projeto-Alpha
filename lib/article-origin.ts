const articleNeighborhoods = [
  'Alto Leblon',
  'Barra da Tijuca',
  'Porto Maravilha',
  'Jardim Botânico',
  'São Conrado',
  'Copacabana',
  'Ipanema',
  'Leblon',
  'Botafogo',
  'Flamengo',
  'Jacarepaguá',
  'Tijuca',
  'Glória',
  'Catete',
  'Gávea',
  'Centro',
] as const;

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR');
}

export function getArticleNeighborhood(title: string) {
  const normalizedTitle = normalize(title);

  if (normalizedTitle.includes('praia do pepe')) return 'Barra da Tijuca';
  if (normalizedTitle.includes('recreio')) return 'Recreio dos Bandeirantes';

  return (
    articleNeighborhoods.find((neighborhood) =>
      normalizedTitle.includes(normalize(neighborhood)),
    ) ?? 'Rio de Janeiro'
  );
}

export function createOrganicArticleSource(title: string, neighborhood: string) {
  const prefix = 'Orgânico | artigo: ';
  const suffix = ` | região: ${neighborhood}`;
  const titleLimit = Math.max(0, 120 - prefix.length - suffix.length);

  return `${prefix}${title.slice(0, titleLimit)}${suffix}`;
}
