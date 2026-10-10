import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { typologyFromMessage } from '@/lib/lead-typology';
import { ActivityForm } from './ActivityForm';
import { LeadStatusForm } from './LeadStatusForm';
import { AssignmentForm } from './AssignmentForm';
import { leadAccessWhere } from '@/lib/lead-access';
import { hasPermission } from '@/lib/permissions';
import { FollowUpActions } from '@/app/admin/agenda/FollowUpActions';
import { createWhatsAppHref, getFollowUpMessage } from '@/lib/whatsapp-follow-up';

export const dynamic = 'force-dynamic';

function formatMoney(value: unknown) {
  if (value === null || value === undefined) {
    return 'Não informado';
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 'Não informado';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(numeric);
}

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}

function activityLabel(type: string) {
  const labels: Record<string, string> = {
    NOTE: 'Nota',
    CALL: 'Ligação',
    WHATSAPP: 'WhatsApp',
    EMAIL: 'E-mail',
    VISIT: 'Visita',
    TASK: 'Tarefa',
  };

  return labels[type] || type;
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('crm:read');

  const { id } = await params;

  const lead = await db.lead.findFirst({
    where: {
      id,
      ...leadAccessWhere(user),
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      activities: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  const submission = await db.analyticsEvent.findFirst({
    where: {
      name: 'lead_submitted',
      metadata: { path: ['leadId'], equals: lead.id },
    },
    select: { metadata: true },
    orderBy: { createdAt: 'desc' },
  });
  const metadata = submission?.metadata;
  const previousPage =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? metadata.referrerPath
      : null;
  const previousPath =
    typeof previousPage === 'string' &&
    previousPage.startsWith('/') &&
    !previousPage.startsWith('//')
      ? previousPage
      : null;

  const assignees = hasPermission(user.role, 'crm:assign')
    ? await db.user.findMany({
        where:
          user.role === 'MANAGER'
            ? {
                isActive: true,
                billingMode: 'INTERNAL',
                OR: [
                  { id: user.id, role: 'MANAGER' },
                  { role: 'CONSULTANT', managerId: user.id },
                ],
              }
            : {
                isActive: true,
                billingMode: 'INTERNAL',
                role: { in: ['CONSULTANT', 'MANAGER', 'DIRECTOR'] },
              },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      })
    : [];

  const pendingFollowUps =
    lead.status === 'WON' || lead.status === 'LOST'
      ? []
      : lead.activities
          .filter((activity) => activity.dueAt && !activity.completedAt)
          .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime())
          .slice(0, 5);

  return (
    <>
      <div className="eyebrow">CRM</div>

      <div className="head">
        <div>
          <h1>{lead.name}</h1>
          <p>Lead criado em {formatDate(lead.createdAt)}</p>
        </div>

        <Link className="btn" href="/admin/leads">
          Voltar para leads
        </Link>
      </div>

      {hasPermission(user.role, 'crm:assign') ? (
        <section className="admin-card">
          <h2>Distribuir lead</h2>
          <AssignmentForm
            leadId={lead.id}
            assignedToId={lead.assignedToId}
            assignees={assignees}
            allowUnassigned={user.role !== 'MANAGER'}
          />
        </section>
      ) : (
        <p>Responsável: {lead.assignedTo?.name || lead.assignedTo?.email || 'Sem responsável'}</p>
      )}

      <section className="admin-card">
        <div className="eyebrow">Controle de sequência</div>
        <h2>Atualizar atendimento</h2>

        {hasPermission(user.role, 'crm:write') && (
          <LeadStatusForm leadId={lead.id} initialStatus={lead.status} />
        )}
      </section>

      <div className="editor-grid">
        <section className="admin-card">
          <div className="eyebrow">Contato</div>

          <dl className="detail-list">
            <div>
              <dt>Telefone</dt>
              <dd>{lead.phone}</dd>
            </div>

            <div>
              <dt>E-mail</dt>
              <dd>{lead.email || 'Não informado'}</dd>
            </div>

            <div>
              <dt>Objetivo</dt>
              <dd>{lead.objective}</dd>
            </div>

            <div>
              <dt>Status</dt>
              <dd>{lead.status}</dd>
            </div>

            <div>
              <dt>Bairro</dt>
              <dd>{lead.neighborhood || 'Não informado'}</dd>
            </div>

            <div>
              <dt>Orçamento mínimo</dt>
              <dd>{formatMoney(lead.budgetMin)}</dd>
            </div>

            <div>
              <dt>Orçamento máximo</dt>
              <dd>{formatMoney(lead.budgetMax)}</dd>
            </div>
          </dl>
        </section>

        <section className="admin-card">
          <div className="eyebrow">Origem</div>

          <dl className="detail-list">
            <div>
              <dt>Tipologia de interesse</dt>
              <dd>{typologyFromMessage(lead.message) || 'Não informada'}</dd>
            </div>
            <div>
              <dt>Fonte</dt>
              <dd>{lead.source || 'Não informado'}</dd>
            </div>
            {lead.articleSlug && (
              <div>
                <dt>Artigo de origem</dt>
                <dd>
                  <Link href={`/artigos/${lead.articleSlug}`}>{lead.articleSlug}</Link>
                </dd>
              </div>
            )}

            {previousPath && (
              <div>
                <dt>Página de referência no domínio</dt>
                <dd>{previousPath}</dd>
              </div>
            )}

            <div>
              <dt>UTM Source</dt>
              <dd>{lead.utmSource || '—'}</dd>
            </div>

            <div>
              <dt>UTM Medium</dt>
              <dd>{lead.utmMedium || '—'}</dd>
            </div>

            <div>
              <dt>UTM Campaign</dt>
              <dd>{lead.utmCampaign || '—'}</dd>
            </div>

            <div>
              <dt>Consentimento</dt>
              <dd>{lead.consent ? 'Sim' : 'Não'}</dd>
            </div>
          </dl>
        </section>
      </div>

      {lead.message && (
        <section className="admin-card">
          <div className="eyebrow">Mensagem</div>
          <p>{lead.message}</p>
        </section>
      )}

      {pendingFollowUps.length > 0 && (
        <section className="admin-card">
          <div className="eyebrow">Próximos passos</div>
          <h2>Acompanhamentos pendentes</h2>
          <p>Registre o contato e o resultado no histórico ao concluir cada acompanhamento.</p>
          <div className="timeline">
            {pendingFollowUps.map((activity) => (
              <article className="timeline-item" key={activity.id}>
                <div className="timeline-marker" />
                <div>
                  <strong>
                    {activityLabel(activity.type)} · {formatDate(activity.dueAt)}
                  </strong>
                  {activity.note && <p>{activity.note}</p>}
                  {hasPermission(user.role, 'crm:write') && (
                    <FollowUpActions
                      activityId={activity.id}
                      href={
                        activity.type === 'WHATSAPP'
                          ? createWhatsAppHref(
                              lead.phone,
                              getFollowUpMessage(activity.note, lead.name, lead.neighborhood),
                            )
                          : undefined
                      }
                    />
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="admin-card">
        <div className="eyebrow">Nova atividade</div>
        <h2>Registrar acompanhamento</h2>

        {hasPermission(user.role, 'crm:write') && <ActivityForm leadId={lead.id} />}
      </section>

      <section className="admin-card">
        <div className="head">
          <div>
            <div className="eyebrow">Histórico</div>
            <h2>Atividades</h2>
          </div>

          <span>{lead.activities.length} registros</span>
        </div>

        {lead.activities.length === 0 ? (
          <p>Nenhuma atividade registrada para este lead.</p>
        ) : (
          <div className="timeline">
            {lead.activities.map((activity) => (
              <article className="timeline-item" key={activity.id}>
                <div className="timeline-marker" />

                <div>
                  <strong>{activityLabel(activity.type)}</strong>

                  <div className="timeline-meta">{formatDate(activity.createdAt)}</div>

                  {activity.note && <p>{activity.note}</p>}

                  {activity.dueAt && <p>Prazo: {formatDate(activity.dueAt)}</p>}

                  {activity.completedAt && <p>Concluído em: {formatDate(activity.completedAt)}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
