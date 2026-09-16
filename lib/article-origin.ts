const articleNeighborhoods = [
  'Alto Leblon',
  'Barra da Tijuca',
  'Jardim Botânico',
  'São Conrado',
  'Copacabana',
  'Ipanema',
  'Leblon',
  'Botafogo',
  'Flamengo',
  'Recreio',
  'Glória',
  'Catete',
  'Gávea',
  'Centro',
] as const;

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
}

export function getArticleNeighborhood(title: string) {
  const normalizedTitle = normalize(title);

  return (
    articleNeighborhoods.find((neighborhood) =>
      normalizedTitle.includes(normalize(neighborhood)),
    ) ?? 'Rio de Janeiro'
  );
}

export function createOrganicArticleSource(title: string, neighborhood: string) {
  return `Orgânico | artigo: ${title} | região: ${neighborhood}`.slice(0, 120);
}
