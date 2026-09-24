import Link from 'next/link';

import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { buildLeadWhere, leadStatuses, parseLeadFilters, statusLabel } from '@/lib/lead-filters';
import { organicContentFromSource } from '@/lib/lead-origin';
import { typologyFromMessage } from '@/lib/lead-typology';
import { alphaPath } from '@/lib/public-path';

export const dynamic = 'force-dynamic';

type LeadItem = {
  id: string;
  name: string;
  phone: string;
  objective: string;
  neighborhood: string | null;
  source: string | null;
  message: string | null;
  status: string;
  activities: Array<{
    id: string;
  }>;
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

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    channel?: string;
    campaign?: string;
    status?: string;
  }>;
}) {
  await requirePermission('crm:read');

  const params = await searchParams;
  const filters = parseLeadFilters(params);
  const { channel, campaign, status } = filters;
  const where = buildLeadWhere(filters);

  const exportParams = new URLSearchParams();
  if (channel) exportParams.set('channel', channel);
  if (campaign) exportParams.set('campaign', campaign);
  if (status) exportParams.set('status', status);

  const exportHref = `/api/admin/leads/export${exportParams.size ? `?${exportParams.toString()}` : ''}`;

  const leads = await db.lead.findMany({
    where,
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

  const organicLeads = leads.filter((lead: LeadItem) => organicContentFromSource(lead.source));
  const organicContentLabels = organicLeads.map(
    (lead: LeadItem) => organicContentFromSource(lead.source) || '',
  );
  const organicRegionLabels = organicLeads.map(
    (lead: LeadItem) => lead.neighborhood || 'Rio de Janeiro',
  );
  const organicByContent = countBy(organicContentLabels);
  const organicByRegion = countBy(organicRegionLabels);
  const organicContentCount = new Set(organicContentLabels).size;
  const organicRegionCount = new Set(organicRegionLabels).size;
  const hasFilters = Boolean(channel || campaign || status);

  return (
    <>
      <div className="eyebrow">CRM</div>
      <h1>Leads</h1>

      <section className="admin-card">
        <div className="head">
          <div>
            <div className="eyebrow">Organização comercial</div>
            <h2>Filtrar a base de leads</h2>
          </div>
          {hasFilters && <span>Filtros ativos</span>}
        </div>

        <form action={alphaPath('/admin/leads')} className="editor-grid">
          <label>
            Canal de captação
            <select defaultValue={channel || ''} name="channel">
              <option value="">Todos os canais</option>
              <option value="organic">Orgânico de conteúdos</option>
              <option value="campaign">Campanhas com UTM</option>
              <option value="direct">Direto / sem origem</option>
            </select>
          </label>

          <label>
            Campanha UTM
            <input defaultValue={campaign} name="campaign" placeholder="Ex.: forms_leads_kronos" />
          </label>

          <label>
            Estágio
            <select defaultValue={status || ''} name="status">
              <option value="">Todos os estágios</option>
              {leadStatuses.map((item) => (
                <option key={item} value={item}>
                  {statusLabel(item)}
                </option>
              ))}
            </select>
          </label>

          <div>
            <button className="btn" type="submit">
              Aplicar filtros
            </button>
            <Link className="btn btn-ghost" href={exportHref}>
              Exportar CSV
            </Link>
            {hasFilters && (
              <Link className="btn btn-ghost" href="/admin/leads">
                Limpar filtros
              </Link>
            )}
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="head">
          <div>
            <div className="eyebrow">Origem orgânica</div>
            <h2>Conteúdos e regiões que geram leads</h2>
          </div>
          <span>
            {hasFilters ? 'Leads filtrados' : 'Últimos leads'}: {leads.length}
          </span>
        </div>

        <div className="kpis">
          <div className="kpi">
            <b>{organicLeads.length}</b>
            Leads orgânicos
          </div>
          <div className="kpi">
            <b>{organicContentCount}</b>
            Conteúdos com conversão
          </div>
          <div className="kpi">
            <b>{organicRegionCount}</b>
            Regiões com conversão
          </div>
        </div>

        {organicLeads.length > 0 ? (
          <div className="editor-grid">
            <div>
              <div className="eyebrow">Conteúdos</div>
              <ul>
                {organicByContent.map((item) => (
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
          <p>Os primeiros leads orgânicos aparecerão aqui com conteúdo e região.</p>
        )}
      </section>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Objetivo</th>
              <th>Tipologia</th>
              <th>Origem</th>
              <th>Região</th>
              <th>Status</th>
              <th>Atividades</th>
            </tr>
          </thead>

          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8}>Nenhum lead encontrado para estes filtros.</td>
              </tr>
            ) : (
              leads.map((lead: LeadItem) => (
                <tr key={lead.id}>
                  <td>
                    <Link href={`/admin/leads/${lead.id}`}>{lead.name}</Link>
                  </td>
                  <td>{lead.phone}</td>
                  <td>{lead.objective}</td>
                  <td>{typologyFromMessage(lead.message) || '—'}</td>
                  <td>{lead.source || 'Site'}</td>
                  <td>{lead.neighborhood || 'Rio de Janeiro'}</td>
                  <td>{statusLabel(lead.status)}</td>
                  <td>{lead.activities.length}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
