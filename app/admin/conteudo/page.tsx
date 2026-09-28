import Link from 'next/link';

import {
  createContentPlanAction,
  updateContentPlanStatusAction,
  updatePublicationAction,
} from './actions';
import { requirePermission } from '@/lib/auth';
import {
  completionFromAttempts,
  contentPlanStatusLabels,
  contentPlanStatuses,
  publicationChannelLabels,
  publicationChannels,
  publicationStatusLabels,
  publicationStatuses,
} from '@/lib/content-calendar';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const defaultCta =
  'Fale agora com o especialista do projeto e receba todo o material em primeira mão.';

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function rioDateTimeLocal(value: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(value)
    .replace(' ', 'T');
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}

export default async function ContentPlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; criado?: string }>;
}) {
  await requirePermission('catalog:write');
  const params = await searchParams;
  const today = startOfDay(new Date());
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 14);

  const [plans, articles] = await Promise.all([
    db.contentPlan.findMany({
      where: { scheduledAt: { gte: today, lt: horizon } },
      include: {
        article: { select: { title: true, slug: true, publishStatus: true } },
        publications: { orderBy: { channel: 'asc' } },
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
    }),
    db.article.findMany({
      where: { publishStatus: { in: ['DRAFT', 'REVIEW', 'PUBLISHED'] } },
      select: { id: true, title: true, publishStatus: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    }),
  ]);

  const todayPlans = plans.filter((plan) => plan.scheduledAt < new Date(today.getTime() + 86_400_000));
  const pendingChannels = plans.flatMap((plan) => plan.publications).filter(
    (publication) => !['PUBLISHED', 'CANCELED'].includes(publication.status),
  ).length;
  const completedPlans = plans.filter((plan) => plan.status === 'COMPLETED').length;

  return (
    <>
      <div className="eyebrow">Operação editorial e social</div>
      <h1>Calendário de conteúdo e postagens</h1>
      <p>
        Planeje artigos e publicações diárias, acompanhe cada canal separadamente e mantenha todos
        os destinos dentro do domínio da Imóveis de Alto Padrão.
      </p>

      {params.criado === '1' && <div className="notice notice-success">Pauta adicionada ao calendário.</div>}
      {params.erro && (
        <div className="notice">
          Não foi possível concluir. Revise os campos, o destino oficial e a confirmação individual
          de cada canal.
        </div>
      )}

      <div className="kpis">
        <div className="kpi"><b>{todayPlans.length}</b>Postagens de hoje</div>
        <div className="kpi"><b>{plans.length}</b>Próximos 14 dias</div>
        <div className="kpi"><b>{pendingChannels}</b>Canais pendentes</div>
        <div className="kpi"><b>{completedPlans}</b>Pautas concluídas</div>
      </div>

      <section className="admin-card">
        <div className="head">
          <div>
            <div className="eyebrow">Nova pauta</div>
            <h2>Preparar publicação</h2>
          </div>
          <Link href="/admin/artigos">Abrir biblioteca de artigos</Link>
        </div>

        <form action={createContentPlanAction} className="editor-grid">
          <label>
            Título da pauta
            <input name="title" required minLength={5} placeholder="Ex.: Kronos — morar perto da praia" />
          </label>
          <label>
            Formato
            <select name="contentType" required defaultValue="REEL">
              <option value="REEL">Reel / vídeo vertical</option>
              <option value="STORIES">Stories</option>
              <option value="CAROUSEL">Carrossel</option>
              <option value="STATIC">Post estático</option>
              <option value="ARTICLE">Artigo</option>
              <option value="SHORT">Short</option>
            </select>
          </label>
          <label>
            Data e hora no Rio
            <input
              type="datetime-local"
              name="scheduledAt"
              required
              defaultValue={rioDateTimeLocal(new Date(Date.now() + 3_600_000))}
            />
          </label>
          <label>
            Empreendimento
            <input name="projectName" placeholder="Kronos, Q Studios, Epic Golf..." />
          </label>
          <label>
            Região
            <input name="region" placeholder="Barra da Tijuca, Ipanema, Centro..." />
          </label>
          <label>
            Público
            <input name="targetAudience" placeholder="Investidor, moradia final, segunda residência..." />
          </label>
          <label className="editor-wide">
            Tema / gancho
            <input name="topic" placeholder="Benefício principal e intenção comercial da publicação" />
          </label>
          <label className="editor-wide">
            Legenda
            <textarea name="caption" rows={5} placeholder="Texto final ou orientação da peça" />
          </label>
          <label className="editor-wide">
            CTA
            <input name="cta" required defaultValue={defaultCta} />
          </label>
          <label>
            Destino oficial
            <input
              name="destinationUrl"
              required
              placeholder="https://imoveisdealtopadraorio.com.br/..."
            />
          </label>
          <label>
            Mídia / material
            <input name="assetUrl" placeholder="URL da foto, vídeo ou pasta autorizada" />
          </label>
          <label className="editor-wide">
            Artigo relacionado
            <select name="articleId" defaultValue="">
              <option value="">Sem artigo vinculado</option>
              {articles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title} — {article.publishStatus}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="editor-wide channel-picker">
            <legend>Canais desta pauta</legend>
            {publicationChannels.map((channel) => (
              <label key={channel}>
                <input type="checkbox" name="channels" value={channel} />
                {publicationChannelLabels[channel]}
              </label>
            ))}
          </fieldset>
          <div className="editor-wide">
            <button className="btn" type="submit">Adicionar ao calendário</button>
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="head">
          <div>
            <div className="eyebrow">Visão operacional</div>
            <h2>Próximos 14 dias</h2>
          </div>
          <span>{plans.length} pauta{plans.length === 1 ? '' : 's'}</span>
        </div>

        {plans.length === 0 ? (
          <p>Nenhuma pauta agendada. Cadastre a primeira publicação diária acima.</p>
        ) : (
          <div className="content-plan-list">
            {plans.map((plan) => {
              const completion = completionFromAttempts(plan.publications.map((item) => item.status));
              return (
                <article className="content-plan-card" key={plan.id}>
                  <div className="head">
                    <div>
                      <div className="eyebrow">{formatDate(plan.scheduledAt)} · {plan.contentType}</div>
                      <h3>{plan.title}</h3>
                      <p>{[plan.projectName, plan.region, plan.targetAudience].filter(Boolean).join(' · ')}</p>
                    </div>
                    <strong>{completion}% publicado</strong>
                  </div>
                  <p><b>Destino:</b> {plan.destinationUrl}</p>
                  {plan.article && (
                    <p>
                      <b>Artigo:</b> {plan.article.title} ({plan.article.publishStatus})
                    </p>
                  )}
                  <form action={updateContentPlanStatusAction} className="inline-form">
                    <input type="hidden" name="id" value={plan.id} />
                    <select name="status" defaultValue={plan.status}>
                      {contentPlanStatuses.map((status) => (
                        <option key={status} value={status}>{contentPlanStatusLabels[status]}</option>
                      ))}
                    </select>
                    <button className="btn btn-ghost" type="submit">Atualizar pauta</button>
                  </form>
                  <div className="publication-grid">
                    {plan.publications.map((publication) => (
                      <form action={updatePublicationAction} className="publication-card" key={publication.id}>
                        <input type="hidden" name="id" value={publication.id} />
                        <b>{publicationChannelLabels[publication.channel]}</b>
                        <select name="status" defaultValue={publication.status}>
                          {publicationStatuses.map((status) => (
                            <option key={status} value={status}>{publicationStatusLabels[status]}</option>
                          ))}
                        </select>
                        <input
                          name="externalUrl"
                          defaultValue={publication.externalUrl || ''}
                          placeholder="URL pública após publicar"
                        />
                        <input
                          name="errorMessage"
                          defaultValue={publication.errorMessage || ''}
                          placeholder="Falha encontrada, se houver"
                        />
                        <button className="btn btn-ghost" type="submit">Salvar canal</button>
                      </form>
                    ))}
                  </div>
                  <small>Criado por {plan.createdBy.name || plan.createdBy.email}</small>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
