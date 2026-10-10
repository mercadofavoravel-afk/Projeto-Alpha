import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const statusNames: Record<string, string> = {
  NEW: 'Novo',
  CONTACTED: 'Em atendimento',
  QUALIFIED: 'Qualificado',
  VISIT_SCHEDULED: 'Visita agendada',
  WON: 'Ganho',
  LOST: 'Perdido',
};

export default async function CustomerSiteLeads({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('sites:manage');
  const { id } = await params;
  const site = await db.customerSite.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true, siteUrl: true },
  });
  if (!site) notFound();
  const [total, leads] = await Promise.all([
    db.customerLead.count({ where: { siteId: site.id } }),
    db.customerLead.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        name: true,
        status: true,
        source: true,
        article: { select: { title: true } },
        createdAt: true,
        _count: {
          select: { activities: { where: { completedAt: null, dueAt: { lt: new Date() } } } },
        },
      },
    }),
  ]);
  return (
    <>
      <p>
        <Link href="/admin/sites">← Meus sites</Link>
      </p>
      <h1>Leads de {site.siteUrl}</h1>
      <p>
        {total} contato(s) deste site. Exibindo os 100 mais recentes. Outros sites e a matriz não
        aparecem aqui.
      </p>
      <section className="admin-card">
        {leads.length === 0 && (
          <p>Nenhum contato recebido pelos formulários dos artigos deste site.</p>
        )}
        {leads.map((lead) => (
          <div className="panel" key={lead.id}>
            <h2>
              <Link href={`/admin/sites/${site.id}/leads/${lead.id}`}>{lead.name}</Link>
            </h2>
            <p>
              {statusNames[lead.status]} · {lead.source} ·{' '}
              {new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'America/Sao_Paulo',
              }).format(lead.createdAt)}
            </p>
            {lead.article && <p>Artigo: {lead.article.title}</p>}
            {lead._count.activities > 0 && (
              <p role="status">{lead._count.activities} tarefa(s) atrasada(s).</p>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
