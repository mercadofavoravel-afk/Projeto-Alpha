import Link from 'next/link';

import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { buildLeadWhere, leadStatuses, parseLeadFilters, statusLabel } from '@/lib/lead-filters';
import { summarizeLeadOrigins } from '@/lib/lead-origin-summary';
import { summarizeUnassignedCoverage } from '@/lib/lead-coverage';
import type { DistributionCandidate } from '@/lib/lead-distribution';
import { leadPageHref, leadsPerPage, resolveLeadPage } from '@/lib/lead-pagination';
import { typologyFromMessage } from '@/lib/lead-typology';
import { alphaPath } from '@/lib/public-path';
import {
  canViewAllLeads,
  canViewUnassignedLeads,
  leadAccessWhere,
  leadAssignmentWhere,
} from '@/lib/lead-access';
import { distributeUnassignedLeadsAction } from './actions';
import { LeadRiskAlerts } from './LeadRiskAlerts';

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
  _count: { activities: number };
  assignedTo: { name: string | null; email: string } | null;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    channel?: string;
    campaign?: string;
    status?: string;
    responsible?: string;
    assignment?: string;
    page?: string;
    distribuidos?: string;
  }>;
}) {
  const user = await requirePermission('crm:read');

  const params = await searchParams;
  const filters = parseLeadFilters(params);
  const { channel, campaign, status, responsible } = filters;
  const assignment = canViewUnassignedLeads(user.role) ? params.assignment : undefined;
  const where = {
    ...buildLeadWhere(filters),
    ...leadAccessWhere(user),
    ...leadAssignmentWhere(user, assignment),
  };

  const exportParams = new URLSearchParams();
  if (channel) exportParams.set('channel', channel);
  if (campaign) exportParams.set('campaign', campaign);
  if (status) exportParams.set('status', status);
  if (responsible) exportParams.set('responsible', responsible);
  if (assignment === 'unassigned' || assignment === 'assigned')
    exportParams.set('assignment', assignment);

  const exportHref = `/api/admin/leads/export${exportParams.size ? `?${exportParams.toString()}` : ''}`;

  const originGroups = await db.lead.groupBy({
    by: ['source', 'neighborhood'],
    where,
    _count: { _all: true },
  });
  const originSummary = summarizeLeadOrigins(originGroups);
  const professionals = canViewAllLeads(user.role)
    ? await db.user.findMany({
        where:
          user.role === 'MANAGER'
            ? {
                OR: [
                  { id: user.id, role: 'MANAGER' },
                  { managerId: user.id, role: 'CONSULTANT' },
                ],
              }
            : { role: { in: ['DIRECTOR', 'MANAGER', 'CONSULTANT'] } },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      })
    : [];
  const coverage = canViewUnassignedLeads(user.role)
    ? await Promise.all([
        db.lead.groupBy({
          by: ['neighborhood'],
          where: { assignedToId: null, status: { notIn: ['WON', 'LOST'] } },
          _count: { _all: true },
          _min: { createdAt: true },
        }),
        db.user.findMany({
          where: {
            isActive: true,
            acceptsLeads: true,
            role: { in: ['DIRECTOR', 'MANAGER', 'CONSULTANT'] },
          },
          select: {
            id: true,
            leadCapacity: true,
            serviceRegions: true,
            lastLeadAssignedAt: true,
            _count: {
              select: { assignedLeads: { where: { status: { notIn: ['WON', 'LOST'] } } } },
            },
          },
        }),
      ]).then(([groups, users]) =>
        summarizeUnassignedCoverage(
          groups,
          users.map(
            (professional): DistributionCandidate => ({
              id: professional.id,
              activeLeadCount: professional._count.assignedLeads,
              leadCapacity: professional.leadCapacity,
              serviceRegions: professional.serviceRegions,
              lastLeadAssignedAt: professional.lastLeadAssignedAt,
            }),
          ),
        ),
      )
    : null;
  const { page, totalPages, skip } = resolveLeadPage(params.page, originSummary.total);
  const leads = await db.lead.findMany({
    where,
    include: {
      assignedTo: { select: { name: true, email: true } },
      _count: { select: { activities: true } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take: leadsPerPage,
  });
  const hasFilters = Boolean(channel || campaign || status || assignment || responsible);

  return (
    <>
      <div className="eyebrow">CRM</div>
      <h1>Leads</h1>
      <p>
        {canViewUnassignedLeads(user.role)
          ? 'Visão da equipe e leads sem responsável.'
          : user.role === 'MANAGER'
            ? 'Leads atribuídos a você e aos corretores vinculados à sua equipe.'
            : 'Seus leads atribuídos.'}
      </p>
      {params.distribuidos !== undefined && (
        <div className="notice notice-success">
          {Number(params.distribuidos) > 0
            ? `${params.distribuidos} lead(s) distribuído(s) pela fila assistida.`
            : 'Nenhum lead foi distribuído. Confira disponibilidade, capacidade e regiões da equipe.'}
        </div>
      )}

      <LeadRiskAlerts user={user} />

      {coverage && (
        <section className="admin-card">
          <div className="head">
            <div>
              <div className="eyebrow">Cobertura da equipe</div>
              <h2>Leads sem responsável por região</h2>
              <p>Fila aberta da empresa, independentemente dos filtros desta página.</p>
            </div>
            <Link className="btn btn-ghost" href="/admin/usuarios">
              Gerenciar equipe
            </Link>
          </div>
          <div className="kpis">
            <div className="kpi">
              <b>{coverage.total}</b>
              Leads aguardando distribuição
            </div>
            <div className="kpi">
              <b>{coverage.withoutCoverage}</b>
              Sem profissional elegível
            </div>
          </div>
          {coverage.total > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Região</th>
                    <th>Na fila</th>
                    <th>Mais antigo</th>
                    <th>Profissionais disponíveis</th>
                    <th>Vagas livres</th>
                  </tr>
                </thead>
                <tbody>
                  {coverage.regions.map((region) => (
                    <tr key={region.region}>
                      <td>{region.region}</td>
                      <td>{region.count}</td>
                      <td>
                        {region.oldestAt
                          ? new Intl.DateTimeFormat('pt-BR', {
                              dateStyle: 'short',
                              timeZone: 'America/Sao_Paulo',
                            }).format(region.oldestAt)
                          : '—'}
                      </td>
                      <td>{region.availableProfessionals || 'Sem cobertura'}</td>
                      <td>{region.freeCapacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Não há leads abertos sem responsável.</p>
          )}
          {coverage.withoutCoverage > 0 && (
            <p>
              Cadastre um profissional para a região ou confirme com a equipe quem pode atendê-la.
              Revise manualmente os leads antigos antes do contato.
            </p>
          )}
        </section>
      )}

      {coverage && coverage.total > 0 && (
        <form action={distributeUnassignedLeadsAction} className="admin-card">
          <div className="head">
            <div>
              <div className="eyebrow">Fila comercial</div>
              <h2>Distribuição assistida</h2>
              <p>
                Distribui até 25 leads sem responsável por disponibilidade, capacidade e região.
              </p>
            </div>
            <button className="btn" type="submit">
              Distribuir fila
            </button>
          </div>
        </form>
      )}

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
              <option value="organic">Busca orgânica identificada</option>
              <option value="campaign">Campanhas com UTM</option>
              <option value="direct">Sem plataforma identificada</option>
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

          {canViewAllLeads(user.role) && (
            <label>
              Profissional responsável
              <select defaultValue={responsible || ''} name="responsible">
                <option value="">Toda a equipe</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name || professional.email}
                  </option>
                ))}
              </select>
            </label>
          )}

          {canViewUnassignedLeads(user.role) && (
            <label>
              Distribuição
              <select defaultValue={assignment || ''} name="assignment">
                <option value="">Todos os leads</option>
                <option value="unassigned">Sem responsável</option>
                <option value="assigned">Já atribuídos</option>
              </select>
            </label>
          )}

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
            <div className="eyebrow">Conteúdo de origem</div>
            <h2>Conteúdos e regiões que geram leads</h2>
          </div>
          <span>
            {hasFilters ? 'Leads filtrados' : 'Todos os leads'}: {originSummary.total}
          </span>
        </div>

        <div className="kpis">
          <div className="kpi">
            <b>{originSummary.contentLeads}</b>
            Leads de conteúdo
          </div>
          <div className="kpi">
            <b>{originSummary.contentCount}</b>
            Conteúdos com conversão
          </div>
          <div className="kpi">
            <b>{originSummary.regionCount}</b>
            Regiões com conversão
          </div>
        </div>

        {originSummary.contentLeads > 0 ? (
          <div className="editor-grid">
            <div>
              <div className="eyebrow">Conteúdos</div>
              <ul>
                {originSummary.byContent.map((item) => (
                  <li key={item.label}>
                    {item.label}: {item.count} lead{item.count === 1 ? '' : 's'}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="eyebrow">Regiões</div>
              <ul>
                {originSummary.byRegion.map((item) => (
                  <li key={item.label}>
                    {item.label}: {item.count} lead{item.count === 1 ? '' : 's'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p>Os primeiros leads de conteúdo aparecerão aqui com conteúdo e região.</p>
        )}
      </section>

      <p>
        {originSummary.total > 0
          ? `Exibindo ${skip + 1}–${skip + leads.length} de ${originSummary.total} leads neste filtro.`
          : 'Nenhum lead neste filtro.'}{' '}
        Os indicadores acima consideram todos os registros visíveis para a sua conta.
      </p>
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
              <th>Corretor</th>
              {canViewAllLeads(user.role) && <th>Distribuição</th>}
              <th>Atividades</th>
            </tr>
          </thead>

          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={canViewAllLeads(user.role) ? 10 : 9}>
                  Nenhum lead encontrado para estes filtros.
                </td>
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
                  <td>{lead.assignedTo?.name || lead.assignedTo?.email || 'Sem responsável'}</td>
                  {canViewAllLeads(user.role) && (
                    <td>
                      <Link href={`/admin/leads/${lead.id}`}>
                        {lead.assignedTo ? 'Transferir' : 'Atribuir corretor'}
                      </Link>
                    </td>
                  )}
                  <td>{lead._count.activities}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <nav aria-label="Páginas de leads">
          {page > 1 && (
            <Link className="btn btn-ghost" href={leadPageHref(exportParams, page - 1)}>
              Página anterior
            </Link>
          )}{' '}
          <span>
            Página {page} de {totalPages}
          </span>{' '}
          {page < totalPages && (
            <Link className="btn btn-ghost" href={leadPageHref(exportParams, page + 1)}>
              Próxima página
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
