import Link from 'next/link';
import type { Prisma } from '@prisma/client';

import { FollowUpActions } from './FollowUpActions';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { createWhatsAppHref, getFollowUpMessage } from '@/lib/whatsapp-follow-up';
import { leadAccessWhere } from '@/lib/lead-access';
import { crmDayStartAfter, crmDayWindow } from '@/lib/crm-day';

export const dynamic = 'force-dynamic';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}

function dueLabel(dueAt: Date, now: Date, tomorrow: Date) {
  if (dueAt < now) {
    return 'Em atraso';
  }

  if (dueAt < tomorrow) {
    return 'Hoje';
  }

  const afterTomorrow = crmDayStartAfter(tomorrow, 1);

  if (dueAt < afterTomorrow) {
    return 'Amanhã';
  }

  return formatDate(dueAt);
}

export default async function AgendaPage() {
  const user = await requirePermission('crm:read');

  const now = new Date();
  const { tomorrow } = crmDayWindow(now);
  const windowEnd = crmDayStartAfter(now, 8);

  const scope: Prisma.LeadActivityWhereInput = {
    lead: { ...leadAccessWhere(user), status: { notIn: ['WON', 'LOST'] } },
    completedAt: null,
  };
  const [activities, overdue, dueToday, windowCount] = await Promise.all([
    db.leadActivity.findMany({
      where: { ...scope, dueAt: { lt: windowEnd } },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            neighborhood: true,
            source: true,
          },
        },
      },
      orderBy: { dueAt: 'asc' },
      take: 100,
    }),
    db.leadActivity.count({ where: { ...scope, dueAt: { lt: now } } }),
    db.leadActivity.count({ where: { ...scope, dueAt: { gte: now, lt: tomorrow } } }),
    db.leadActivity.count({ where: { ...scope, dueAt: { lt: windowEnd } } }),
  ]);

  return (
    <>
      <div className="eyebrow">CRM</div>
      <h1>Agenda de acompanhamentos</h1>

      <div className="kpis">
        <div className="kpi">
          <b>{overdue}</b>Em atraso
        </div>
        <div className="kpi">
          <b>{dueToday}</b>Para hoje
        </div>
        <div className="kpi">
          <b>{windowCount}</b>Em atraso e até os próximos 7 dias
        </div>
      </div>

      <section className="admin-card">
        <div className="head">
          <div>
            <div className="eyebrow">Atendimento ativo</div>
            <h2>Próximos contatos</h2>
          </div>

          <span>
            Sem disparo automático · {activities.length} de {windowCount} exibidos
          </span>
        </div>

        {activities.length === 0 ? (
          <p>Não há acompanhamentos pendentes até os próximos 7 dias.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Prazo</th>
                  <th>Lead</th>
                  <th>Origem</th>
                  <th>Região</th>
                  <th>Canal</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.dueAt ? dueLabel(activity.dueAt, now, tomorrow) : '—'}</td>
                    <td>
                      <Link href={`/admin/leads/${activity.lead.id}`}>{activity.lead.name}</Link>
                    </td>
                    <td>{activity.lead.source || 'Site'}</td>
                    <td>{activity.lead.neighborhood || 'Rio de Janeiro'}</td>
                    <td>{activity.type === 'WHATSAPP' ? 'WhatsApp' : activity.type}</td>
                    <td>
                      <FollowUpActions
                        activityId={activity.id}
                        leadHref={`/admin/leads/${activity.lead.id}`}
                        href={
                          activity.type === 'WHATSAPP'
                            ? createWhatsAppHref(
                                activity.lead.phone,
                                getFollowUpMessage(
                                  activity.note,
                                  activity.lead.name,
                                  activity.lead.neighborhood,
                                ),
                              )
                            : undefined
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
