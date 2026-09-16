import type { Prisma } from '@prisma/client';
import Link from 'next/link';

import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'VISIT_SCHEDULED', 'WON', 'LOST'] as const;

type LeadStatusFilter = (typeof leadStatuses)[number];

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
  const match = source.match(/^Orgânico \\| artigo: (.+) \\| região:/);
  return match?.[1] || source;
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

function validStatus(value: string | undefined): LeadStatusFilter | undefined {
  return leadStatuses.includes(value as LeadStatusFilter) ? (value as LeadStatusFilter) : undefined;
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
  const params = await searchParams;
  const channel = ['organic', 'campaign', 'direct'].includes(params.channel || '')
    ? params.channel
    : undefined;
  const campaign = params.campaign?.trim() || '';
  const status = validStatus(params.status);

  const where: Prisma.LeadWhereInput = {
    ...(status ? { status } : {}),
    ...(campaign
      ? {
          utmCampaign: {
            contains: campaign,
            mode: 'insensitive' as const,
          },
        }
      : {}),
    ...(channel === 'organic'
      ? {
          source: {
            startsWith: 'Orgânico | artigo:',
          },
        }
      : {}),
    ...(channel === 'campaign'
      ? {
          utmSource: {
            not: null,
          },
        }
      : {}),
    ...(channel === 'direct'
      ? {
          source: null,
          utmSource: null,
        }
      : {}),
  };

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

        <form action="/admin/leads" className="editor-grid">
          <label>
            Canal de captação
            <select defaultValue={channel || ''} name="channel">
              <option value="">Todos os canais</option>
              <option value="organic">Orgânico de artigos</option>
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
            <h2>Artigos e regiões que geram leads</h2>
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
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7}>Nenhum lead encontrado para estes filtros.</td>
              </tr>
            ) : (
              leads.map((lead: LeadItem) => (
                <tr key={lead.id}>
                  <td>
                    <Link href={`/admin/leads/${lead.id}`}>{lead.name}</Link>
                  </td>
                  <td>{lead.phone}</td>
                  <td>{lead.objective}</td>
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
