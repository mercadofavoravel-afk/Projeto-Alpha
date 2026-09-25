import Link from 'next/link';

import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { canViewAllLeads, leadAccessWhere, leadAssignmentWhere } from '@/lib/lead-access';

export const dynamic = 'force-dynamic';

type LeadMetric = {
  source: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  status: string;
};

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function countBy(values: string[]) {
  return Array.from(
    values.reduce((counts, value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
      return counts;
    }, new Map<string, number>()),
  )
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label))
    .slice(0, 5);
}

function channelFromLead(lead: LeadMetric) {
  if (lead.source?.startsWith('Orgânico | artigo:')) {
    return 'Orgânico (artigos)';
  }

  return lead.utmSource || lead.source || 'Direto';
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    NEW: 'Novo',
    CONTACTED: 'Em atendimento',
    QUALIFIED: 'Qualificado',
    VISIT_SCHEDULED: 'Visita agendada',
    WON: 'Ganho',
    LOST: 'Perdido',
  };

  return labels[status] || status;
}

export default async function Page() {
  const user = await requireUser();
  const leadScope = leadAccessWhere(user);
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    projects,
    leadCount,
    unassignedCount,
    books,
    recentLeads,
    overdueActivities,
    dueTodayActivities,
  ] = await Promise.all([
    db.project.count(),
    db.lead.count({ where: leadScope }),
    canViewAllLeads(user.role)
      ? db.lead.count({ where: leadAssignmentWhere(user, 'unassigned') })
      : Promise.resolve(0),
    db.bookIngestion.count(),
    db.lead.findMany({
      where: leadScope,
      select: {
        source: true,
        utmSource: true,
        utmCampaign: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 500,
    }),
    db.leadActivity.count({
      where: {
        lead: leadScope,
        completedAt: null,
        dueAt: {
          lt: today,
        },
      },
    }),
    db.leadActivity.count({
      where: {
        lead: leadScope,
        completedAt: null,
        dueAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
  ]);

  const organicLeads = recentLeads.filter((lead: LeadMetric) =>
    lead.source?.startsWith('Orgânico | artigo:'),
  ).length;
  const channels = countBy(recentLeads.map((lead: LeadMetric) => channelFromLead(lead)));
  const campaigns = countBy(
    recentLeads
      .map((lead: LeadMetric) => lead.utmCampaign?.trim())
      .filter((campaign): campaign is string => Boolean(campaign)),
  );
  const statuses = countBy(recentLeads.map((lead: LeadMetric) => statusLabel(lead.status)));
  const hasOperationalAlerts = overdueActivities > 0 || dueTodayActivities > 0;

  return (
    <>
      <div className="eyebrow">Painel operacional</div>
      <h1>Visão geral</h1>

      <section className="admin-card">
        <h2>Acessos rápidos</h2>
        <div className="admin-shortcuts">
          {hasPermission(user.role, 'crm:read') && (
            <>
              <Link href="/admin/leads">CRM e leads</Link>
              <Link href="/admin/agenda">Follow-up e agenda</Link>
              {canViewAllLeads(user.role) && (
                <Link href="/admin/leads?assignment=unassigned">Distribuir leads</Link>
              )}
            </>
          )}
          {hasPermission(user.role, 'catalog:write') && (
            <>
              <Link href="/admin/empreendimentos">Páginas de empreendimentos</Link>
              <Link href="/admin/artigos">Artigos do blog</Link>
              <Link href="/admin/discovery">Links para revisar</Link>
            </>
          )}
          {hasPermission(user.role, 'users:manage') && (
            <Link href="/admin/usuarios">Usuários e acessos</Link>
          )}
        </div>
      </section>

      <div className="kpis">
        <div className="kpi">
          <b>{projects}</b>Empreendimentos
        </div>
        <div className="kpi">
          <b>{leadCount}</b>
          {canViewAllLeads(user.role) ? 'Leads' : 'Meus leads'}
        </div>
        {canViewAllLeads(user.role) && (
          <div className="kpi">
            <b>{unassignedCount}</b>Sem responsável
          </div>
        )}
        <div className="kpi">
          <b>{organicLeads}</b>Leads orgânicos
        </div>
        <div className="kpi">
          <b>{books}</b>Books
        </div>
      </div>

      <section className="admin-card">
        <div className="head">
          <div>
            <div className="eyebrow">Prioridade operacional</div>
            <h2>
              {hasOperationalAlerts
                ? 'Acompanhamentos que exigem ação'
                : 'Nenhum acompanhamento pendente para hoje'}
            </h2>
          </div>
          <Link href="/admin/agenda">Abrir agenda</Link>
        </div>

        {hasOperationalAlerts ? (
          <div className="kpis">
            <div className="kpi">
              <b>{overdueActivities}</b>Em atraso
            </div>
            <div className="kpi">
              <b>{dueTodayActivities}</b>Para hoje
            </div>
          </div>
        ) : (
          <p>Os próximos contatos continuam disponíveis na Agenda de acompanhamentos.</p>
        )}
      </section>

      <section className="admin-card">
        <div className="head">
          <div>
            <div className="eyebrow">Captação comercial</div>
            <h2>Origem, campanhas e atendimento</h2>
          </div>
          <span>Últimos {recentLeads.length} leads</span>
        </div>

        {recentLeads.length === 0 ? (
          <p>Os indicadores aparecerão quando os primeiros leads forem registrados.</p>
        ) : (
          <div className="editor-grid">
            <div>
              <div className="eyebrow">Canais</div>
              <ul>
                {channels.map((item) => (
                  <li key={item.label}>
                    {item.label}: {item.count} lead{item.count === 1 ? '' : 's'}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="eyebrow">Campanhas</div>
              {campaigns.length === 0 ? (
                <p>Não há campanhas UTM registradas neste recorte.</p>
              ) : (
                <ul>
                  {campaigns.map((item) => (
                    <li key={item.label}>
                      {item.label}: {item.count} lead{item.count === 1 ? '' : 's'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="eyebrow">Estágios</div>
              <ul>
                {statuses.map((item) => (
                  <li key={item.label}>
                    {item.label}: {item.count} lead{item.count === 1 ? '' : 's'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
