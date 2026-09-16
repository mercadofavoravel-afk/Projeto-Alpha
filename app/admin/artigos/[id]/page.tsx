npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requirePermission, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

import { saveArticleAction } from '../actions';

export const dynamic = 'force-dynamic';

const statusLabels = {
  DRAFT: 'Rascunho',
  REVIEW: 'Em revisão',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

export default async function ArticleEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ criado?: string; salvo?: string; erro?: string }>;
}) {
  await requirePermission('catalog:write');

  const [{ id }, query, user] = await Promise.all([params, searchParams, getCurrentUser()]);

  const article = await db.article.findUnique({
    where: {
      id,
    },
  });

  if (!article || !user) {
    notFound();
  }

  const canPublish = hasPermission(user.role, 'catalog:publish');

  return (
    <>
      <div className="eyebrow">SEO editorial</div>

      <div className="head">
        <div>
          <h1>{article.title}</h1>

          <p>
            Escreva conteúdo original, útil e direcionado aos canais da Imóveis de Alto Padrão Rio.
          </p>
        </div>

        <Link href="/admin/artigos">← Voltar aos artigos</Link>
      </div>

      {query.criado === '1' && (
        <p className="notice">
          Rascunho estruturado criado. Complete a pesquisa e revise o texto antes de publicar.
        </p>
      )}

      {query.salvo === '1' && <p className="notice">Artigo salvo com sucesso.</p>}

      {query.erro === 'campos' && (
        <p className="notice">Informe título e conteúdo com pelo menos 50 caracteres.</p>
      )}

      {query.erro === 'rascunho' && (
        <p className="notice">
          Este texto ainda é um rascunho. Revise o conteúdo e remova o aviso de rascunho antes de
          publicar.
        </p>
      )}

      {query.erro === 'destinos' && (
        <p className="notice">
          A publicação foi bloqueada: use somente links do site, WhatsApp ou e-mail da Imóveis de
          Alto Padrão Rio.
        </p>
      )}

      {query.erro === 'revisao' && (
        <p className="notice">Para publicar, salve o artigo primeiro com o status “Em revisão”.</p>
      )}

      {query.erro === 'seo' && (
        <p className="notice">
          Para publicar, preencha categoria, resumo, título SEO e descrição SEO.
        </p>
      )}

      <form action={saveArticleAction} className="editor-form">
        <input type="hidden" name="id" value={article.id} />

        <section className="admin-card">
          <div className="eyebrow">Identidade</div>

          <div className="editor-grid">
            <label className="editor-wide">
              Título
              <input name="title" required minLength={5} defaultValue={article.title} />
            </label>

            <label>
              Categoria
              <input
                name="category"
                defaultValue={article.category ?? ''}
                placeholder="Ex.: Investimento"
              />
            </label>

            <label>
              Status
              <select name="publishStatus" defaultValue={article.publishStatus}>
                {(['DRAFT', 'REVIEW', 'ARCHIVED'] as const).map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}

                {canPublish && <option value="PUBLISHED">{statusLabels.PUBLISHED}</option>}
              </select>
            </label>

            <label className="editor-wide">
              URL do artigo
              <input name="slug" defaultValue={article.slug} required />
            </label>

            <label className="editor-wide">
              Resumo
              <textarea
                name="excerpt"
                rows={4}
                maxLength={320}
                defaultValue={article.excerpt ?? ''}
                placeholder="Resumo que aparece na página de conteúdos e nos resultados de busca."
              />
            </label>

            <label className="editor-wide">
              Imagem principal (URL)
              <input
                name="heroImage"
                defaultValue={article.heroImage ?? ''}
                placeholder="/images/artigo.webp ou URL autorizada"
              />
            </label>
          </div>
        </section>

        <section className="admin-card">
          <div className="eyebrow">Conteúdo</div>

          <label>
            Texto do artigo
            <textarea
              name="content"
              rows={24}
              required
              minLength={50}
              defaultValue={article.content}
              placeholder="Escreva em parágrafos. Use uma linha em branco entre eles."
            />
          </label>
        </section>

        <section className="admin-card">
          <div className="eyebrow">Google</div>

          <div className="editor-grid">
            <label className="editor-wide">
              Título SEO
              <input
                name="seoTitle"
                maxLength={70}
                defaultValue={article.seoTitle ?? ''}
                placeholder={article.title}
              />
            </label>

            <label className="editor-wide">
              Descrição SEO
              <textarea
                name="seoDescription"
                rows={4}
                maxLength={180}
                defaultValue={article.seoDescription ?? ''}
                placeholder="Descrição para os resultados de busca."
              />
            </label>
          </div>
        </section>

        <div className="editor-save">
          <button className="btn" type="submit">
            Salvar artigo
          </button>

          {article.publishStatus === 'PUBLISHED' && (
            <Link href={`/artigos/${article.slug}`} target="_blank" rel="noreferrer">
              Ver página pública →
            </Link>
          )}
        </div>
      </form>
    </>
  );
}
