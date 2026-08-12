import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

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
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission('crm:read');

  const { id } = await params;

  const lead = await db.lead.findUnique({
    where: {
      id,
    },
    include: {
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

  return (
    <>
      <div className="eyebrow">CRM</div>

      <div className="head">
        <div>
          <h1>{lead.name}</h1>
          <p>
            Lead criado em {formatDate(lead.createdAt)}
          </p>
        </div>

        <Link className="btn" href="/admin/leads">
          Voltar para leads
        </Link>
      </div>

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
              <dt>Fonte</dt>
              <dd>{lead.source || 'Não informado'}</dd>
            </div>

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
              <article
                className="timeline-item"
                key={activity.id}
              >
                <div className="timeline-marker" />

                <div>
                  <strong>{activity.type}</strong>

                  <div className="timeline-meta">
                    {formatDate(activity.createdAt)}
                  </div>

                  {activity.note && <p>{activity.note}</p>}

                  {activity.dueAt && (
                    <p>
                      Prazo: {formatDate(activity.dueAt)}
                    </p>
                  )}

                  {activity.completedAt && (
                    <p>
                      Concluído em:{' '}
                      {formatDate(activity.completedAt)}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
