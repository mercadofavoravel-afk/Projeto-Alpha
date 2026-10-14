import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requirePermission } from '@/lib/auth';
import {
  customerLeadStatuses,
  customerLeadWhere,
  parseCustomerLeadFilters,
} from '@/lib/customer-lead-export';
import { customerLeadRiskQueries } from '@/lib/customer-lead-risk';
import { db } from '@/lib/db';
import { firstContactMinutes, stalledHours } from '@/lib/lead-risk';

export const dynamic = 'force-dynamic';

const statusNames: Record<string, string> = {
  NEW: 'Novo',
  CONTACTED: 'Em atendimento',
  QUALIFIED: 'Qualificado',
  VISIT_SCHEDULED: 'Visita agendada',
  WON: 'Ganho',
  LOST: 'Perdido',
};

export default async function CustomerSiteLeads({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string }>;
}) {
  const user = await requirePermission('sites:manage');
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const filters = parseCustomerLeadFilters(query);
  const site = await db.customerSite.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true, siteUrl: true },
  });
  if (!site) notFound();
  const now = new Date();
  const risks = customerLeadRiskQueries(site.id, now);
  const leadWhere = customerLeadWhere(site.id, filters);
  const [total, leads, alerts] = await Promise.all([
    db.customerLead.count({ where: leadWhere }),
    db.customerLead.findMany({
      where: leadWhere,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        name: true,
        status: true,
        source: true,
        article: { select: { title: true } },
        createdAt: true,
        _count: {
          select: { activities: { where: { completedAt: null, dueAt: { lt: now } } } },
        },
      },
    }),
    Promise.all(
      Object.entries(risks).map(async ([key, where]) => ({
        key,
        count: await db.customerLead.count({ where }),
        leads: await db.customerLead.findMany({
          where,
          select: { id: true, name: true },
          orderBy: { createdAt: 'asc' },
          take: 5,
        }),
      })),
    ),
  ]);
  const alertNames: Record<string, string> = {
    firstContact: `Primeiro contato pendente há mais de ${firstContactMinutes} min`,
    overdue: 'Tarefa com prazo vencido',
    stalled: `Atendimento sem contato registrado há mais de ${stalledHours} h`,
  };
  const exportQuery = new URLSearchParams();
  if (filters.status) exportQuery.set('status', filters.status);
  if (filters.query) exportQuery.set('q', filters.query);
  if (filters.from) exportQuery.set('from', filters.from);
  if (filters.to) exportQuery.set('to', filters.to);
  const exportHref =
    `/api/customer-sites/${site.id}/leads/export` +
    (exportQuery.size ? `?${exportQuery.toString()}` : '');

  return (
    <>
      <p>
        <Link href="/admin/sites">← Meus sites</Link>
      </p>
      <h1>Leads de {site.siteUrl}</h1>
      <p>
        {total} lead(s) com estes filtros. Exibindo até os 100 mais recentes. A busca e a exportação
        incluem somente os dados deste site.
      </p>
      <form method="get" className="admin-card form-grid">
        <h2>Filtrar leads</h2>
        <label>
          Buscar por nome, telefone, e-mail, origem ou artigo
          <input name="q" defaultValue={filters.query} maxLength={120} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={filters.status ?? ''}>
            <option value="">Todos</option>
            {customerLeadStatuses.map((status) => (
              <option key={status} value={status}>
                {statusNames[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          De
          <input type="date" name="from" defaultValue={filters.from} />
        </label>
        <label>
          Até
          <input type="date" name="to" defaultValue={filters.to} />
        </label>
        <div>
          <button className="btn" type="submit">
            Aplicar filtros
          </button>{' '}
          <Link className="btn" href={`/admin/sites/${site.id}/leads`}>
            Limpar
          </Link>{' '}
          <a className="btn" href={exportHref}>
            Exportar CSV
          </a>
        </div>
      </form>
      <section className="admin-card" aria-label="Alertas de atendimento deste site">
        <h2>Leads que precisam de atenção</h2>
        <p>
          Atualizado ao abrir o painel. Prazos corridos; um lead pode aparecer em mais de um alerta.
        </p>
        <div className="editor-grid">
          {alerts.map(({ key, count, leads: flagged }) => (
            <div key={key}>
              <strong>
                {count} · {alertNames[key]}
              </strong>
              {flagged.length > 0 ? (
                <ul>
                  {flagged.map((lead) => (
                    <li key={lead.id}>
                      <Link href={`/admin/sites/${site.id}/leads/${lead.id}`}>{lead.name}</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum lead nesta condição.</p>
              )}
              {count > flagged.length && <p>Mostrando os {flagged.length} mais antigos.</p>}
            </div>
          ))}
        </div>
      </section>
      <section className="admin-card">
        {leads.length === 0 && <p>Nenhum contato corresponde aos filtros neste site.</p>}
        {leads.map((lead) => (
          <div className="panel" key={lead.id}>
            <h2>
              <Link href={`/admin/sites/${site.id}/leads/${lead.id}`}>{lead.name}</Link>
            </h2>
            <p>
              {statusNames[lead.status]} · {lead.source} ·{' '}
              {new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'America/Sao_Paulo',
              }).format(lead.createdAt)}
            </p>
            {lead.article && <p>Artigo: {lead.article.title}</p>}
            {lead._count.activities > 0 && (
              <p role="status">{lead._count.activities} tarefa(s) atrasada(s).</p>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
