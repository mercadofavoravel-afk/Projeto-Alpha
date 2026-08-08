import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const [projects, leads, books] = await Promise.all([
    db.project.count(),
    db.lead.count(),
    db.bookIngestion.count(),
  ]);
  return (
    <>
      <div className="eyebrow">Painel operacional</div>
      <h1>Visão geral</h1>
      <div className="kpis">
        <div className="kpi">
          <b>{projects}</b>Empreendimentos
        </div>
        <div className="kpi">
          <b>{leads}</b>Leads
        </div>
        <div className="kpi">
          <b>{books}</b>Books
        </div>
        <div className="kpi">
          <b>Protegido</b>Sessão
        </div>
      </div>
    </>
  );
}
