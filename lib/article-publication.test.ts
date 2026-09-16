import { describe, expect, it } from 'vitest';

import { getArticlePublicationIssues } from './article-publication';

describe('article publication checklist', () => {
  const completeArticle = {
    category: 'Investimento',
    content:
      'Conteúdo original e revisado para orientar o leitor com informações úteis sobre o mercado imobiliário.',
    excerpt: 'Guia para investidores e compradores de alto padrão no Rio de Janeiro.',
    seoDescription:
      'Entenda os critérios para avaliar oportunidades imobiliárias no Rio de Janeiro.',
    seoTitle: 'Como avaliar oportunidades imobiliárias no Rio',
    title: 'Como avaliar oportunidades imobiliárias no Rio',
  };

  it('accepts an article with the required editorial and SEO fields', () => {
    expect(getArticlePublicationIssues(completeArticle)).toEqual([]);
  });

  it('reports the missing fields before publication', () => {
    expect(
      getArticlePublicationIssues({
        ...completeArticle,
        category: '',
        excerpt: '',
        seoDescription: '',
        seoTitle: '',
      }),
    ).toEqual(['Categoria', 'Resumo', 'Título SEO', 'Descrição SEO']);
  });
});
