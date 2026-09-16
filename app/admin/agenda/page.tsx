import Link from 'next/link';

import { db } from '@/lib/db';

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

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const destination = digits.startsWith('55') ? digits : `55${digits}`;

  return `https://wa.me/${destination}`;
}

export default async function AgendaPage() {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + 7);
  windowEnd.setHours(23, 59, 59, 999);

  const activities = await db.leadActivity.findMany({
    where: {
      completedAt: null,
      dueAt: {
        lte: windowEnd,
      },
    },
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
    orderBy: {
      dueAt: 'asc',
    },
    take: 100,
  });

  const overdue = activities.filter(
    (activity) => activity.dueAt && activity.dueAt < today,
  ).length;
  const dueToday = activities.filter(
    (activity) =>
      activity.dueAt && activity.dueAt >= today && activity.dueAt < tomorrow,
  ).length;

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
          <b>{activities.length}</b>Até os próximos 7 dias
        </div>
      </div>

      <section className="admin-card">
        <div className="head">
          <div>
            <div className="eyebrow">Atendimento ativo</div>
            <h2>Próximos contatos</h2>
          </div>

          <span>Sem disparo automático</span>
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
                      <a
                        className="btn"
                        href={whatsappLink(activity.lead.phone)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Abrir WhatsApp
                      </a>
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
