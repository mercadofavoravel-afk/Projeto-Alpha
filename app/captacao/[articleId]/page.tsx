import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { assignableSubscriptionWhere } from '@/lib/commercial-subscription';
import { db } from '@/lib/db';
import { submitCustomerArticleLead } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Solicitar atendimento',
  robots: { index: false, follow: false },
};

function queryValue(input: string | undefined) {
  return typeof input === 'string' ? input.slice(0, 200) : '';
}

export default async function CustomerCapturePage({
  params,
  searchParams,
}: {
  params: Promise<{ articleId: string }>;
  searchParams: Promise<{
    resultado?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>;
}) {
  const [{ articleId }, query] = await Promise.all([params, searchParams]);
  if (!/^[a-z0-9]{20,40}$/u.test(articleId)) notFound();
  const article = await db.customerArticle.findFirst({
    where: {
      id: articleId,
      status: 'PUBLISHED',
      site: { owner: { isActive: true, ...assignableSubscriptionWhere() } },
    },
    select: { title: true, publicUrl: true, site: { select: { siteUrl: true } } },
  });
  if (!article) notFound();
  const siteName = new URL(article.site.siteUrl).hostname;
  return (
    <main style={{ maxWidth: 780, margin: '3rem auto', padding: '1.5rem' }}>
      <p>Atendimento solicitado em {siteName}</p>
      <h1>{article.title}</h1>
      <p>Preencha os dados para receber atendimento sobre este artigo.</p>
      {query.resultado === 'enviado' ? (
        <p role="status">
          Solicitação recebida. A equipe responsável pelo site poderá entrar em contato.
        </p>
      ) : (
        <>
          {query.resultado === 'invalido' && (
            <p role="alert">Confira os dados e o consentimento.</p>
          )}
          {query.resultado === 'erro' && <p role="alert">Falha temporária. Tente novamente.</p>}
          {query.resultado === 'indisponivel' && (
            <p role="alert">Atendimento indisponível no momento.</p>
          )}
          <form action={submitCustomerArticleLead} className="admin-card form-grid">
            <input type="hidden" name="articleId" value={articleId} />
            <input type="hidden" name="utmSource" value={queryValue(query.utm_source)} />
            <input type="hidden" name="utmMedium" value={queryValue(query.utm_medium)} />
            <input type="hidden" name="utmCampaign" value={queryValue(query.utm_campaign)} />
            <div style={{ position: 'absolute', left: '-10000px' }} aria-hidden="true">
              <label>
                Não preencher
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <label>
              Nome
              <input name="name" minLength={2} maxLength={120} required autoComplete="name" />
            </label>
            <label>
              Telefone / WhatsApp
              <input
                name="phone"
                type="tel"
                minLength={8}
                maxLength={30}
                required
                autoComplete="tel"
              />
            </label>
            <label>
              E-mail
              <input name="email" type="email" maxLength={254} required autoComplete="email" />
            </label>
            <label>
              Objetivo
              <select name="objective" defaultValue="LIVE">
                <option value="LIVE">Moradia</option>
                <option value="INVEST">Investimento</option>
                <option value="PATRIMONY">Patrimônio</option>
                <option value="SELL">Venda</option>
                <option value="RENT">Locação</option>
                <option value="OTHER">Outro</option>
              </select>
            </label>
            <label>
              Mensagem
              <textarea name="message" maxLength={2000} rows={4} />
            </label>
            <label>
              Tipologia de interesse
              <input name="typology" maxLength={120} />
            </label>
            <label>
              <input type="checkbox" name="consent" value="true" required /> Autorizo o contato da
              equipe deste site sobre esta solicitação.
            </label>
            <button className="btn" type="submit">
              Solicitar atendimento
            </button>
          </form>
        </>
      )}
      {article.publicUrl && (
        <p>
          <a href={article.publicUrl}>Voltar ao artigo</a>
        </p>
      )}
    </main>
  );
}
