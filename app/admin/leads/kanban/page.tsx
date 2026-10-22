import Link from 'next/link';
import React from 'react';

import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { leadStatuses, statusLabel } from '@/lib/lead-filters';
import { leadAccessWhere } from '@/lib/lead-access';
import { kanbanPageHref, kanbanPageSize } from '@/lib/lead-kanban';
import { resolveLeadPage } from '@/lib/lead-pagination';

export const dynamic = 'force-dynamic';

type KanbanLead = {
  id: string;
  name: string;
  neighborhood: string | null;
  source: string | null;
  status: string;
  _count: { activities: number };
};

export default async function LeadKanbanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission('crm:read');
  const params = await searchParams;
  const scope = leadAccessWhere(user);
  const groups = await db.lead.groupBy({
    by: ['status'],
    where: scope,
    _count: { _all: true },
  });
  const totals = Object.fromEntries(groups.map((group) => [group.status, group._count._all]));
  const columns = await Promise.all(
    leadStatuses.map(async (status) => {
      const rawPage = params[`page_${status}`];
      const total = totals[status] || 0;
      const pagination = resolveLeadPage(
        typeof rawPage === 'string' ? rawPage : undefined,
        total,
        kanbanPageSize,
      );
      const leads = total
        ? await db.lead.findMany({
            where: { AND: [scope, { status }] },
            select: {
              id: true,
              name: true,
              neighborhood: true,
              source: true,
              status: true,
              _count: { select: { activities: true } },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: kanbanPageSize,
            skip: pagination.skip,
          })
        : [];
      return { status, total, ...pagination, leads };
    }),
  );
  const pages = Object.fromEntries(columns.map((column) => [column.status, column.page]));
  const activeTotal = leadStatuses.reduce(
    (sum, status) => sum + (!['WON', 'LOST'].includes(status) ? totals[status] || 0 : 0),
    0,
  );

  return (
    <>
      <div className="eyebrow">CRM</div>
      <div className="head">
        <div>
          <h1>Quadro comercial</h1>
          <p>Todos os leads da sua carteira, com navegação independente em cada estágio.</p>
        </div>

        <Link className="btn" href="/admin/leads">
          Ver lista de leads
        </Link>
      </div>

      <div className="kpis">
        <div className="kpi">
          <b>{activeTotal}</b>
          Em atendimento
        </div>
        <div className="kpi">
          <b>{totals.VISIT_SCHEDULED || 0}</b>
          Visitas agendadas
        </div>
        <div className="kpi">
          <b>{totals.WON || 0}</b>
          Ganhos
        </div>
      </div>

      <section className="kanban-wrap" aria-label="Leads por estágio">
        <div className="kanban-board">
          {columns.map(({ status, leads: columnLeads, total, page, totalPages, skip }) => {
            return (
              <section className="kanban-column" key={status}>
                <div className="kanban-column-head">
                  <strong>{statusLabel(status)}</strong>
                  <span>{total}</span>
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
                          {lead._count.activities} atividade
                          {lead._count.activities === 1 ? '' : 's'}
                        </em>
                      </Link>
                    ))}
                  </div>
                )}
                {total > 0 && (
                  <p>
                    Exibindo {skip + 1}–{skip + columnLeads.length} de {total}.
                  </p>
                )}
                {totalPages > 1 && (
                  <nav aria-label={`Páginas de ${statusLabel(status)}`}>
                    {page > 1 && (
                      <Link href={kanbanPageHref(pages, status, page - 1)}>Anteriores</Link>
                    )}
                    <span>
                      {' '}
                      Página {page} de {totalPages}{' '}
                    </span>
                    {page < totalPages && (
                      <Link href={kanbanPageHref(pages, status, page + 1)}>Próximos</Link>
                    )}
                  </nav>
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
          min-width: 26px;
          padding-inline: 5px;
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
