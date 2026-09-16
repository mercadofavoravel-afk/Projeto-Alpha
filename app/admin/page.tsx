import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type LeadMetric = {
  source: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  status: string;
};

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
  const [projects, leadCount, books, recentLeads] = await Promise.all([
    db.project.count(),
    db.lead.count(),
    db.bookIngestion.count(),
    db.lead.findMany({
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

  return (
    <>
      <div className="eyebrow">Painel operacional</div>
      <h1>Visão geral</h1>

      <div className="kpis">
        <div className="kpi">
          <b>{projects}</b>Empreendimentos
        </div>
        <div className="kpi">
          <b>{leadCount}</b>Leads
        </div>
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
