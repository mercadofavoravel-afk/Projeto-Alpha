import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { saveSiteArticle, sendSiteArticle } from '../actions';

export const dynamic = 'force-dynamic';

export default async function SiteArticleEditor({
  params,
}: {
  params: Promise<{ id: string; articleId: string }>;
}) {
  const user = await requirePermission('sites:manage');
  const { id, articleId } = await params;
  const article = await db.customerArticle.findFirst({
    where: { id: articleId, siteId: id, site: { ownerId: user.id } },
    include: { site: { select: { siteUrl: true } } },
  });
  if (!article) notFound();
  const editable = article.status !== 'PUBLISHED';
  return (
    <>
      <p>
        <Link href={`/admin/sites/${id}/artigos`}>← Blog de {article.site.siteUrl}</Link>
      </p>
      <h1>{article.title}</h1>
      <p>
        Status: {article.status}. Primeiro salve e revise; depois envie um rascunho ao WordPress. A
        publicação exige outra ação explícita.
      </p>
      {article.publicUrl && (
        <p>
          <a href={article.publicUrl} target="_blank" rel="noopener noreferrer">
            Ver artigo publicado
          </a>
        </p>
      )}
      {article.status === 'PUBLISHED' && !article.publicUrl && (
        <p>
          O WordPress confirmou a publicação, mas não retornou uma URL HTTPS. Confira diretamente no
          painel do site.
        </p>
      )}
      {editable && (
        <form action={saveSiteArticle} className="admin-card form-grid">
          <input type="hidden" name="siteId" value={id} />
          <input type="hidden" name="articleId" value={article.id} />
          <label>
            Título
            <input
              name="title"
              defaultValue={article.title}
              minLength={5}
              maxLength={180}
              required
            />
          </label>
          <label>
            Slug do site
            <input name="slug" defaultValue={article.slug} maxLength={150} required />
          </label>
          <label>
            Resumo
            <textarea name="excerpt" defaultValue={article.excerpt} maxLength={320} rows={3} />
          </label>
          <label>
            Título SEO
            <input name="seoTitle" defaultValue={article.seoTitle} maxLength={70} />
          </label>
          <label>
            Descrição SEO
            <textarea
              name="seoDescription"
              defaultValue={article.seoDescription}
              maxLength={160}
              rows={3}
            />
          </label>
          <label>
            Conteúdo
            <textarea name="content" defaultValue={article.content} maxLength={100000} rows={24} />
          </label>
          <button className="btn" type="submit" name="review" value="false">
            Salvar rascunho
          </button>
          <button type="submit" name="review" value="true">
            Marcar revisado
          </button>
        </form>
      )}
      {article.status === 'REVIEW' && (
        <form action={sendSiteArticle} className="admin-card">
          <h2>Enviar rascunho remoto</h2>
          <p>
            O post ficará como rascunho no WordPress. O conteúdo e o resumo serão enviados; os
            campos de plugin SEO continuam pendentes de integração específica.
          </p>
          <input type="hidden" name="siteId" value={id} />
          <input type="hidden" name="articleId" value={article.id} />
          <button className="btn" type="submit">
            Enviar rascunho ao WordPress
          </button>
        </form>
      )}
      {article.status === 'REMOTE_DRAFT' && (
        <form action={sendSiteArticle} className="admin-card">
          <h2>Publicar no WordPress</h2>
          <p>
            Confira a prévia no painel WordPress deste site antes de publicar. A confirmação desta
            ação altera a visibilidade pública do post.
          </p>
          <input type="hidden" name="siteId" value={id} />
          <input type="hidden" name="articleId" value={article.id} />
          <button className="btn" type="submit" name="publish" value="true">
            Publicar artigo
          </button>
        </form>
      )}
    </>
  );
}
