import Link from 'next/link';

import { FollowUpActions } from './FollowUpActions';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { createWhatsAppHref, getFollowUpMessage } from '@/lib/whatsapp-follow-up';
import { leadAccessWhere } from '@/lib/lead-access';

export const dynamic = 'force-dynamic';

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}

function dueLabel(dueAt: Date, today: Date, tomorrow: Date) {
  if (dueAt < today) {
    return 'Em atraso';
  }

  if (dueAt < tomorrow) {
    return 'Hoje';
  }

  const afterTomorrow = new Date(tomorrow);
  afterTomorrow.setDate(afterTomorrow.getDate() + 1);

  if (dueAt < afterTomorrow) {
    return 'Amanhã';
  }

  return formatDate(dueAt);
}

export default async function AgendaPage() {
  const user = await requirePermission('crm:read');

  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + 7);
  windowEnd.setHours(23, 59, 59, 999);

  const scope = { lead: leadAccessWhere(user), completedAt: null };
  const [activities, overdue, dueToday, windowCount] = await Promise.all([
    db.leadActivity.findMany({
      where: { ...scope, dueAt: { lte: windowEnd } },
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
    db.leadActivity.count({ where: { ...scope, dueAt: { lt: today } } }),
    db.leadActivity.count({ where: { ...scope, dueAt: { gte: today, lt: tomorrow } } }),
    db.leadActivity.count({ where: { ...scope, dueAt: { lte: windowEnd } } }),
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
                    <td>{activity.dueAt ? dueLabel(activity.dueAt, today, tomorrow) : '—'}</td>
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
