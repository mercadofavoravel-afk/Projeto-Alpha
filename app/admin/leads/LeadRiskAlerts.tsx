import Link from 'next/link';
import type { UserRole } from '@prisma/client';

import { db } from '@/lib/db';
import { firstContactMinutes, leadRiskQueries, stalledHours } from '@/lib/lead-risk';

const labels: Record<string, string> = {
  unassigned: `Sem responsável há mais de ${firstContactMinutes} min`,
  firstContact: `Primeiro atendimento pendente há mais de ${firstContactMinutes} min`,
  overdueFollowUp: 'Acompanhamento com prazo vencido',
  stalled: `Sem ação concluída há mais de ${stalledHours} h`,
};

export async function LeadRiskAlerts({ user }: { user: { id: string; role: UserRole } }) {
  const queries = leadRiskQueries(user, new Date());
  const alerts = await Promise.all(
    Object.entries(queries).map(async ([key, where]) => {
      const [count, leads] = await Promise.all([
        db.lead.count({ where }),
        db.lead.findMany({
          where,
          select: { id: true, name: true, assignedTo: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
          take: 5,
        }),
      ]);
      return { key, count, leads };
    }),
  );

  return (
    <section className="admin-card" aria-label="Alertas de atendimento">
      <div className="head">
        <div>
          <div className="eyebrow">Prioridade comercial</div>
          <h2>Leads que precisam de atenção</h2>
          <p>
            Atualizado ao abrir o painel. Prazos corridos; uma ficha pode aparecer em mais de um
            alerta.
          </p>
        </div>
        <Link href="/admin/agenda">Abrir agenda</Link>
      </div>
      <div className="editor-grid">
        {alerts.map(({ key, count, leads }) => (
          <div key={key}>
            <strong>
              {count} · {labels[key]}
            </strong>
            {leads.length > 0 ? (
              <ul>
                {leads.map((lead) => (
                  <li key={lead.id}>
                    <Link href={`/admin/leads/${lead.id}`}>{lead.name}</Link>
                    {lead.assignedTo?.name ? ` · ${lead.assignedTo.name}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum lead nesta condição.</p>
            )}
            {count > leads.length && <p>Mostrando os {leads.length} mais antigos.</p>}
            {count > 0 && (
              <Link href={`/admin/leads?risk=${encodeURIComponent(key)}`}>
                Ver todos os {count} leads desta prioridade
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
