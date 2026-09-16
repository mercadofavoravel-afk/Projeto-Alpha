import Link from 'next/link';

import { createArticleAction } from './actions';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const statusLabels = {
  DRAFT: 'Rascunho',
  REVIEW: 'Em revisão',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

export default async function ArticlesAdminPage() {
  const articles = await db.article.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const suggestedTopics = [
    'Por que investir em Ipanema: localização, liquidez e estilo de vida',
    'Studios no Rio de Janeiro: quando o investimento faz sentido',
    'Como escolher um imóvel de alto padrão na Barra da Tijuca',
    'Morar ou investir em Leblon: o que avaliar antes da decisão',
    'Valorização imobiliária no Rio: fatores que influenciam cada bairro',
    'Imóvel novo ou pronto: qual opção combina com seu momento',
  ];

  return (
    <>
      <div className="eyebrow">SEO editorial</div>

      <h1>Artigos</h1>

      <p>
        Crie conteúdo para captar buscas orgânicas. Somente artigos publicados aparecem no site
        público e no sitemap.
      </p>

      <section className="panel">
        <h2>Pautas próprias de SEO</h2>
        <p>
          Crie rascunhos a partir de temas de busca. Cada artigo deve usar pesquisa como
          referência, texto original e CTA direcionado à Imóveis de Alto Padrão Rio.
        </p>
        <div className="topic-grid">
          {suggestedTopics.map((topic) => (
            <form action={createArticleAction} key={topic} className="topic-card">
              <strong>{topic}</strong>
              <input type="hidden" name="title" value={topic} />
              <button className="secondary" type="submit">Criar rascunho</button>
            </form>
          ))}
        </div>
      </section>

      <form action={createArticleAction} className="panel form-grid">
        <label>
          Título do novo artigo
          <input
            name="title"
            required
            minLength={5}
            placeholder="Ex.: Por que investir em Ipanema?"
          />
        </label>

        <button className="primary" type="submit">
          Criar rascunho
        </button>
      </form>

      <div className="panel">
        <h2>Biblioteca editorial</h2>

        {articles.length === 0 ? (
          <p>Nenhum artigo criado ainda.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Artigo</th>
                  <th>Status</th>
                  <th>Atualizado</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {articles.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <b>{article.title}</b>
                      <small>/artigos/{article.slug}</small>
                    </td>
                    <td>{statusLabels[article.publishStatus]}</td>
                    <td>{article.updatedAt.toLocaleDateString('pt-BR')}</td>
                    <td>
                      <Link href={`/admin/artigos/${article.id}`}>Editar →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
