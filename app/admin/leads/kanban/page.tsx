import Link from 'next/link';

import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { leadStatuses, statusLabel } from '@/lib/lead-filters';
import { leadAccessWhere } from '@/lib/lead-access';

export const dynamic = 'force-dynamic';

type KanbanLead = {
  id: string;
  name: string;
  neighborhood: string | null;
  source: string | null;
  status: string;
  activities: Array<{
    id: string;
  }>;
};

export default async function LeadKanbanPage() {
  const user = await requirePermission('crm:read');

  const leads = await db.lead.findMany({
    where: leadAccessWhere(user),
    include: {
      activities: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 200,
  });

  const activeLeads = leads.filter((lead: KanbanLead) => !['WON', 'LOST'].includes(lead.status));

  return (
    <>
      <div className="eyebrow">CRM</div>
      <div className="head">
        <div>
          <h1>Quadro comercial</h1>
          <p>Visão dos últimos {leads.length} leads por estágio de atendimento.</p>
        </div>

        <Link className="btn" href="/admin/leads">
          Ver lista de leads
        </Link>
      </div>

      <div className="kpis">
        <div className="kpi">
          <b>{activeLeads.length}</b>
          Em atendimento
        </div>
        <div className="kpi">
          <b>{leads.filter((lead: KanbanLead) => lead.status === 'VISIT_SCHEDULED').length}</b>
          Visitas agendadas
        </div>
        <div className="kpi">
          <b>{leads.filter((lead: KanbanLead) => lead.status === 'WON').length}</b>
          Ganhos
        </div>
      </div>

      <section className="kanban-wrap" aria-label="Leads por estágio">
        <div className="kanban-board">
          {leadStatuses.map((status) => {
            const columnLeads = leads.filter((lead: KanbanLead) => lead.status === status);

            return (
              <section className="kanban-column" key={status}>
                <div className="kanban-column-head">
                  <strong>{statusLabel(status)}</strong>
                  <span>{columnLeads.length}</span>
                </div>

                {columnLeads.length === 0 ? (
                  <p className="kanban-empty">Nenhum lead neste estágio.</p>
                ) : (
                  <div className="kanban-cards">
                    {columnLeads.map((lead: KanbanLead) => (
                      <Link className="kanban-card" href={`/admin/leads/${lead.id}`} key={lead.id}>
                        <strong>{lead.name}</strong>
                        <span>{lead.neighborhood || 'Rio de Janeiro'}</span>
                        <small>{lead.source || 'Site'}</small>
                        <em>
                          {lead.activities.length} atividade
                          {lead.activities.length === 1 ? '' : 's'}
                        </em>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </section>

      <style>{`
        .kanban-wrap {
          overflow-x: auto;
          padding-bottom: 12px;
        }

        .kanban-board {
          display: grid;
          grid-template-columns: repeat(6, minmax(240px, 1fr));
          gap: 16px;
          min-width: 1560px;
        }

        .kanban-column {
          min-height: 280px;
          padding: 16px;
          border: 1px solid rgba(22, 34, 29, 0.12);
          background: rgba(255, 255, 255, 0.58);
        }

        .kanban-column-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(22, 34, 29, 0.12);
        }

        .kanban-column-head strong {
          font: 600 1rem/1.2 Georgia, serif;
        }

        .kanban-column-head span {
          display: grid;
          width: 26px;
          height: 26px;
          place-items: center;
          border-radius: 999px;
          background: #16221d;
          color: #fff;
          font-size: 0.75rem;
        }

        .kanban-cards {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }

        .kanban-card {
          display: grid;
          gap: 7px;
          padding: 15px;
          border: 1px solid rgba(22, 34, 29, 0.12);
          background: #fff;
        }

        .kanban-card:hover {
          border-color: #8a7548;
        }

        .kanban-card strong {
          font: 600 1rem/1.2 Georgia, serif;
        }

        .kanban-card span,
        .kanban-card small,
        .kanban-card em,
        .kanban-empty {
          color: var(--m);
          font-size: 0.78rem;
          line-height: 1.4;
        }

        .kanban-card em {
          color: #887550;
          font-style: normal;
        }

        .kanban-empty {
          margin: 18px 0 0;
        }
      `}</style>
    </>
  );
}
