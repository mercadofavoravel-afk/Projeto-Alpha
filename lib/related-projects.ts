type RelatedProject = {
  slug: string;
  name: string;
  neighborhood: { name: string };
};

const genericSlugWords = new Set([
  'be',
  'in',
  'rio',
  'mozak',
  'barra',
  'da',
  'tijuca',
  'ipanema',
  'leblon',
  'copacabana',
  'flamengo',
  'laranjeiras',
  'arpoador',
]);

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim();
}

function containsPhrase(text: string, phrase: string) {
  return Boolean(phrase) && ` ${text} `.includes(` ${phrase} `);
}

function projectScore(title: string, neighborhood: string, project: RelatedProject) {
  const name = normalize(project.name);
  const distinctiveName = project.slug
    .split('-')
    .filter((word) => !genericSlugWords.has(word))
    .join(' ');

  if (containsPhrase(title, name) || containsPhrase(title, distinctiveName)) return 2;

  const projectNeighborhoods = project.neighborhood.name.split('/').map(normalize);
  return neighborhood !== 'rio de janeiro' && projectNeighborhoods.includes(neighborhood) ? 1 : 0;
}

export function relatedProjectsForArticle<T extends RelatedProject>(
  title: string,
  neighborhood: string,
  projects: T[],
): T[] {
  const normalizedTitle = normalize(title);
  const normalizedNeighborhood = normalize(neighborhood);

  return projects
    .map((project, index) => ({
      project,
      index,
      score: projectScore(normalizedTitle, normalizedNeighborhood, project),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3)
    .map(({ project }) => project);
}
