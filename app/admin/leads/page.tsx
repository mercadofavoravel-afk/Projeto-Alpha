import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

function articleFromSource(source: string) {
  const match = source.match(/^Orgânico \| artigo: (.+) \| região:/);
  return match?.[1] || source;
}

type LeadItem = {
  id: string;
  name: string;
  phone: string;
  objective: string;
  neighborhood: string | null;
  source: string | null;
  status: string;
  activities: Array<{
    id: string;
  }>;
};

export default async function LeadsPage() {
  const leads = await db.lead.findMany({
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
    take: 100,
  });

  const organicLeads = leads.filter((lead: LeadItem) =>
    lead.source?.startsWith('Orgânico | artigo:'),
  );
  const organicArticleLabels = organicLeads.map((lead: LeadItem) =>
    articleFromSource(lead.source || ''),
  );
  const organicRegionLabels = organicLeads.map(
    (lead: LeadItem) => lead.neighborhood || 'Rio de Janeiro',
  );
  const organicByArticle = countBy(organicArticleLabels);
  const organicByRegion = countBy(organicRegionLabels);
  const organicArticleCount = new Set(organicArticleLabels).size;
  const organicRegionCount = new Set(organicRegionLabels).size;

  return (
    <>
      <div className="eyebrow">CRM</div>
      <h1>Leads</h1>

      <section className="admin-card">
        <div className="head">
          <div>
            <div className="eyebrow">Origem orgânica</div>
            <h2>Artigos e regiões que geram leads</h2>
          </div>
          <span>Últimos {leads.length} leads</span>
        </div>

        <div className="kpis">
          <div className="kpi">
            <b>{organicLeads.length}</b>
            Leads orgânicos
          </div>
          <div className="kpi">
            <b>{organicArticleCount}</b>
            Artigos com conversão
          </div>
          <div className="kpi">
            <b>{organicRegionCount}</b>
            Regiões com conversão
          </div>
        </div>

        {organicLeads.length > 0 ? (
          <div className="editor-grid">
            <div>
              <div className="eyebrow">Artigos</div>
              <ul>
                {organicByArticle.map((item) => (
                  <li key={item.label}>
                    {item.label}: {item.count} lead{item.count === 1 ? '' : 's'}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="eyebrow">Regiões</div>
              <ul>
                {organicByRegion.map((item) => (
                  <li key={item.label}>
                    {item.label}: {item.count} lead{item.count === 1 ? '' : 's'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p>Os primeiros leads vindos de artigos aparecerão aqui com artigo e região.</p>
        )}
      </section>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Objetivo</th>
              <th>Origem</th>
              <th>Região</th>
              <th>Status</th>
              <th>Atividades</th>
            </tr>
          </thead>

          <tbody>
            {leads.map((lead: LeadItem) => (
              <tr key={lead.id}>
                <td>
                  <Link href={`/admin/leads/${lead.id}`}>{lead.name}</Link>
                </td>
                <td>{lead.phone}</td>
                <td>{lead.objective}</td>
                <td>{lead.source || 'Site'}</td>
                <td>{lead.neighborhood || 'Rio de Janeiro'}</td>
                <td>{lead.status}</td>
                <td>{lead.activities.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
