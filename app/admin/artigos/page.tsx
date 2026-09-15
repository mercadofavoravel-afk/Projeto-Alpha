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

  return (
    <>
      <div className="eyebrow">SEO editorial</div>

      <h1>Artigos</h1>

      <p>
        Crie conteúdo para captar buscas orgânicas. Somente artigos publicados aparecem no site
        público e no sitemap.
      </p>

      <form action={createArticleAction} className="panel form-grid">
        <label>
          Título do novo artigo
          <input name="title" required minLength={5} placeholder="Ex.: Por que investir em Ipanema?" />
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
