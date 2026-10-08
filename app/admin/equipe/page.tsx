import Link from 'next/link';

import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { leadRiskQueries } from '@/lib/lead-risk';
import { commercialTeamWhere } from '@/lib/team-access';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const actor = await requireRole(['ADMIN', 'DIRECTOR', 'MANAGER']);
  const where = commercialTeamWhere(actor);
  const now = new Date();
  const [people, total, unassigned] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        acceptsLeads: true,
        leadCapacity: true,
        serviceRegions: true,
        manager: { select: { name: true, email: true } },
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      take: 100,
    }),
    db.user.count({ where }),
    actor.role === 'MANAGER'
      ? Promise.resolve(null)
      : db.lead.count({
          where: { assignedToId: null, status: { notIn: ['WON', 'LOST'] } },
        }),
  ]);

  const members: Array<
    (typeof people)[number] & {
      active: number;
      firstContact: number;
      overdue: number;
      stalled: number;
    }
  > = [];
  // Bound concurrent database work so a larger team does not exhaust the Neon pool.
  for (let offset = 0; offset < people.length; offset += 10) {
    const batch = await Promise.all(
      people.slice(offset, offset + 10).map(async (person) => {
        // Use each professional as the scope, so a manager row never includes the whole team.
        const risks = leadRiskQueries({ id: person.id, role: 'CONSULTANT' }, now);
        const [active, firstContact, overdue, stalled] = await Promise.all([
          db.lead.count({
            where: { assignedToId: person.id, status: { notIn: ['WON', 'LOST'] } },
          }),
          db.lead.count({ where: risks.firstContact }),
          db.lead.count({ where: risks.overdueFollowUp }),
          db.lead.count({ where: risks.stalled }),
        ]);
        return { ...person, active, firstContact, overdue, stalled };
      }),
    );
    members.push(...batch);
  }

  return (
    <>
      <div className="eyebrow">CRM · gestão comercial</div>
      <h1>Equipe e atendimento</h1>
      <p>
        Contagens atuais dos leads atribuídos a cada profissional. Prazos corridos: primeiro contato
        após 15 minutos, acompanhamento vencido e inatividade após 48 horas. Uma ficha pode aparecer
        em mais de uma coluna. Os alertas são recalculados ao abrir a página.
      </p>
      <div className="kpis">
        <div className="kpi">
          <b>{total}</b>Profissionais comerciais
        </div>
        {unassigned !== null && (
          <div className="kpi">
            <b>{unassigned}</b>Leads ativos sem responsável
          </div>
        )}
        <div className="kpi">
          <b>{members.reduce((sum, member) => sum + member.firstContact, 0)}</b>
          Primeiros contatos pendentes na equipe exibida
        </div>
      </div>
      <div className="admin-card">
        <div className="head">
          <div>
            <h2>Fila por profissional</h2>
            <p>
              {members.length} de {total} profissionais exibidos.
            </p>
          </div>
          {actor.role !== 'MANAGER' && (
            <Link className="btn" href="/admin/usuarios">
              Cadastrar ou ajustar equipe
            </Link>
          )}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Profissional</th>
                <th>Disponibilidade</th>
                <th>Ativos</th>
                <th>Primeiro contato</th>
                <th>Follow-up vencido</th>
                <th>Parados 48 h</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <b>{member.name || member.email}</b> ·{' '}
                    {member.role === 'CONSULTANT'
                      ? 'Corretor'
                      : member.role === 'MANAGER'
                        ? 'Gerente'
                        : 'Diretor'}
                    <br />
                    <small>
                      {member.manager
                        ? `Gerente: ${member.manager.name || member.manager.email} · `
                        : ''}
                      {member.serviceRegions.join(', ') || 'Todas as regiões'}
                    </small>
                  </td>
                  <td>
                    {member.isActive && member.acceptsLeads ? 'Recebendo' : 'Indisponível'} ·{' '}
                    {member.active}/{member.leadCapacity}
                  </td>
                  <td>
                    <Link href={`/admin/leads?responsible=${encodeURIComponent(member.id)}`}>
                      {member.active}
                    </Link>
                  </td>
                  <td>{member.firstContact}</td>
                  <td>{member.overdue}</td>
                  <td>{member.stalled}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={6}>Nenhum profissional comercial cadastrado nesta equipe.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {total > members.length && (
          <p>
            Exibindo os primeiros 100 profissionais. Use a página de usuários para consultar os
            demais.
          </p>
        )}
      </div>
      {unassigned !== null && unassigned > 0 && (
        <p>
          <Link href="/admin/leads?assignment=unassigned">
            Revisar e distribuir leads sem responsável
          </Link>
        </p>
      )}
    </>
  );
}
