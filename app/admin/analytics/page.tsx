import Link from 'next/link';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const [e, r, l, v] = await Promise.all([
    db.analyticsEvent.count(),
    db.recommendationProfile.count(),
    db.lead.count(),
    db.analyticsEvent.count({ where: { name: 'project_view' } }),
  ]);
  return (
    <div className="admin">
      <aside className="side">
        <div className="brand">
          ALPHA ADMIN<small>ANALYTICS</small>
        </div>
        <Link href="/admin">Visão geral</Link>
        <Link href="/admin/analytics">Analytics</Link>
        <Link href="/admin/recomendacoes">Recomendações</Link>
      </aside>
      <main className="main">
        <div className="eyebrow">Inteligência de produto</div>
        <h1>Indicadores</h1>
        <div className="kpis">
          <div className="kpi">
            <b>{e}</b>Eventos
          </div>
          <div className="kpi">
            <b>{r}</b>Recomendações
          </div>
          <div className="kpi">
            <b>{l}</b>Leads
          </div>
          <div className="kpi">
            <b>{v}</b>Visualizações
          </div>
        </div>
      </main>
    </div>
  );
}
