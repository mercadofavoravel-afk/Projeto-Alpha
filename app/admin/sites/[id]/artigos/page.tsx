import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { createSiteArticle } from './actions';

export const dynamic = 'force-dynamic';

export default async function SiteArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string }>;
}) {
  const user = await requirePermission('sites:manage');
  const [{ id }, { result }] = await Promise.all([params, searchParams]);
  const site = await db.customerSite.findFirst({
    where: { id, ownerId: user.id },
    select: {
      id: true,
      siteUrl: true,
      articles: {
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, status: true, publicUrl: true, updatedAt: true },
      },
    },
  });
  if (!site) notFound();
  const notices: Record<string, string> = {
    invalid: 'Informe um título válido e exclusivo para o site.',
    duplicate: 'Já existe um artigo com esse endereço neste site.',
    missing: 'O site ou artigo não pertence a esta conta.',
    saved: 'Rascunho salvo.',
    review:
      'Revise o texto no Alpha antes de enviá-lo ao WordPress; para publicar, confirme antes o rascunho remoto.',
    incomplete: 'Complete o conteúdo, resumo e campos SEO antes de revisar.',
    published: 'Artigo publicado no WordPress. Confira a URL pública e a renderização.',
    'remote-draft': 'Rascunho enviado ao WordPress. Confira a prévia antes de publicar.',
    remote:
      'O WordPress não confirmou a operação. Confira o post remoto antes de tentar novamente.',
    configuration: 'A credencial deste site está indisponível. Reconecte o WordPress.',
    conflict:
      'A alteração não foi gravada no Alpha. Confira o post remoto antes de tentar novamente.',
  };
  return (
    <>
      <p>
        <Link href="/admin/sites">← Meus sites</Link>
      </p>
      <h1>Blog de {site.siteUrl}</h1>
      <p>
        Os artigos desta área pertencem somente a este site. O título SEO e a descrição ficam no
        Alpha; plugins de SEO do WordPress exigem integração própria.
      </p>
      {result && <p role="status">{notices[result] || 'Confira a operação.'}</p>}
      <form action={createSiteArticle} className="admin-card form-grid">
        <h2>Novo artigo</h2>
        <input type="hidden" name="siteId" value={site.id} />
        <label>
          Título
          <input name="title" minLength={5} maxLength={180} required />
        </label>
        <button className="btn" type="submit">
          Criar rascunho
        </button>
      </form>
      <section className="admin-card">
        <h2>Artigos ({site.articles.length})</h2>
        {site.articles.length === 0 && <p>Nenhum artigo cadastrado.</p>}
        {site.articles.map((article) => (
          <div className="panel" key={article.id}>
            <h3>
              <Link href={`/admin/sites/${site.id}/artigos/${article.id}`}>{article.title}</Link>
            </h3>
            <p>
              Status: {article.status} · Atualizado em{' '}
              {new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'short',
                timeZone: 'America/Sao_Paulo',
              }).format(article.updatedAt)}
            </p>
            {article.publicUrl && (
              <a href={article.publicUrl} target="_blank" rel="noopener noreferrer">
                Abrir artigo publicado
              </a>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
