export type ArticlePublicationInput = {
  category: string;
  content: string;
  excerpt: string;
  seoDescription: string;
  seoTitle: string;
  title: string;
};

export function getArticlePublicationIssues(input: ArticlePublicationInput) {
  const issues: string[] = [];

  if (input.title.trim().length < 5) {
    issues.push('Título');
  }

  if (input.content.trim().length < 50) {
    issues.push('Conteúdo');
  }

  if (!input.category.trim()) {
    issues.push('Categoria');
  }

  if (!input.excerpt.trim()) {
    issues.push('Resumo');
  }

  if (!input.seoTitle.trim()) {
    issues.push('Título SEO');
  }

  if (!input.seoDescription.trim()) {
    issues.push('Descrição SEO');
  }

  return issues;
}
