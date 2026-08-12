import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  await requirePermission('analytics:read');

  const [
    totalEvents,
    projectViews,
    recommendations,
    leadConversions,
    leads,
    sessions,
  ] = await Promise.all([
    db.analyticsEvent.count(),

    db.analyticsEvent.count({
      where: {
        name: 'project_view',
      },
    }),

    db.analyticsEvent.count({
      where: {
        name: 'recommendation_generated',
      },
    }),

    db.analyticsEvent.count({
      where: {
        name: 'lead_submitted',
      },
    }),

    db.lead.count(),

    db.analyticsEvent.findMany({
      where: {
        sessionKey: {
          not: null,
        },
      },
      select: {
        sessionKey: true,
      },
      distinct: ['sessionKey'],
    }),
  ]);

  return (
    <>
      <div className="eyebrow">Inteligência de produto</div>

      <div className="head">
        <div>
          <h1>Analytics</h1>
          <p>
            Visão consolidada de comportamento, recomendação e
            conversão.
          </p>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi">
          <b>{totalEvents}</b>
          Eventos
        </div>

        <div className="kpi">
          <b>{sessions.length}</b>
          Sessões identificadas
        </div>

        <div className="kpi">
          <b>{projectViews}</b>
          Visualizações de imóveis
        </div>

        <div className="kpi">
          <b>{recommendations}</b>
          Recomendações geradas
        </div>

        <div className="kpi">
          <b>{leadConversions}</b>
          Conversões rastreadas
        </div>

        <div className="kpi">
          <b>{leads}</b>
          Leads no CRM
        </div>
      </div>

      <section className="admin-card">
        <div className="eyebrow">Funil interno</div>
        <h2>Eventos monitorados</h2>

        <dl className="detail-list">
          <div>
            <dt>Visualização de empreendimento</dt>
            <dd>project_view</dd>
          </div>

          <div>
            <dt>Recomendação gerada</dt>
            <dd>recommendation_generated</dd>
          </div>

          <div>
            <dt>Lead enviado</dt>
            <dd>lead_submitted</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
