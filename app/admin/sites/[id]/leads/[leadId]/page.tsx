import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  addCustomerLeadNote,
  completeCustomerLeadActivity,
  updateCustomerLeadStatus,
} from '../actions';

export const dynamic = 'force-dynamic';

export default async function CustomerLeadDetails({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; leadId: string }>;
  searchParams: Promise<{ resultado?: string }>;
}) {
  const user = await requirePermission('sites:manage');
  const [{ id, leadId }, { resultado }] = await Promise.all([params, searchParams]);
  const lead = await db.customerLead.findFirst({
    where: { id: leadId, siteId: id, site: { ownerId: user.id } },
    include: {
      article: { select: { title: true, publicUrl: true } },
      activities: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!lead) notFound();
  return (
    <>
      <p>
        <Link href={`/admin/sites/${id}/leads`}>← Leads deste site</Link>
      </p>
      <h1>{lead.name}</h1>
      {resultado === 'salvo' && <p role="status">Atualização salva.</p>}
      {resultado === 'invalido' && <p role="alert">Confira os dados.</p>}
      {resultado === 'ausente' && <p role="alert">O registro não está disponível nesta conta.</p>}
      <section className="admin-card">
        <p>Telefone: {lead.phone}</p>
        <p>E-mail: {lead.email || 'Não informado'}</p>
        <p>
          Objetivo: {lead.objective} · Tipologia: {lead.typology || 'Não informada'}
        </p>
        <p>Origem: {lead.source}</p>
        {lead.article && (
          <p>
            Artigo:{' '}
            {lead.article.publicUrl ? (
              <a href={lead.article.publicUrl}>{lead.article.title}</a>
            ) : (
              lead.article.title
            )}
          </p>
        )}
        <p>
          UTM:{' '}
          {[lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(' / ') ||
            'Não informada'}
        </p>
        {lead.message && <p>Mensagem: {lead.message}</p>}
        <p>Consentimento: {lead.consent ? 'Registrado' : 'Não registrado'}</p>
      </section>
      <form action={updateCustomerLeadStatus} className="admin-card form-grid">
        <h2>Etapa do atendimento</h2>
        <input type="hidden" name="siteId" value={id} />
        <input type="hidden" name="leadId" value={lead.id} />
        <label>
          Status
          <select name="status" defaultValue={lead.status}>
            <option value="NEW">Novo</option>
            <option value="CONTACTED">Em atendimento</option>
            <option value="QUALIFIED">Qualificado</option>
            <option value="VISIT_SCHEDULED">Visita agendada</option>
            <option value="WON">Ganho</option>
            <option value="LOST">Perdido</option>
          </select>
        </label>
        <button className="btn" type="submit">
          Salvar status
        </button>
      </form>
      <form action={addCustomerLeadNote} className="admin-card form-grid">
        <h2>Registrar contato ou observação</h2>
        <input type="hidden" name="siteId" value={id} />
        <input type="hidden" name="leadId" value={lead.id} />
        <label>
          Tipo de registro
          <select name="type" defaultValue="NOTE">
            <option value="NOTE">Observação</option>
            <option value="CALL">Ligação realizada</option>
            <option value="WHATSAPP">Contato pelo WhatsApp</option>
            <option value="EMAIL">E-mail enviado</option>
            <option value="VISIT">Visita realizada</option>
          </select>
        </label>
        <label>
          Nota
          <textarea name="note" minLength={3} maxLength={2000} rows={4} required />
        </label>
        <button className="btn" type="submit">
          Salvar nota
        </button>
      </form>
      <section className="admin-card">
        <h2>Histórico e tarefas</h2>
        {lead.activities.map((activity) => (
          <div className="panel" key={activity.id}>
            <p>{activity.note || activity.type}</p>
            {activity.dueAt && (
              <p>
                Prazo:{' '}
                {new Intl.DateTimeFormat('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                  timeZone: 'America/Sao_Paulo',
                }).format(activity.dueAt)}
              </p>
            )}
            {activity.completedAt ? (
              <p>Concluída.</p>
            ) : (
              activity.dueAt && (
                <form action={completeCustomerLeadActivity}>
                  <input type="hidden" name="siteId" value={id} />
                  <input type="hidden" name="leadId" value={lead.id} />
                  <input type="hidden" name="activityId" value={activity.id} />
                  <button type="submit">Marcar concluída</button>
                </form>
              )
            )}
          </div>
        ))}
      </section>
    </>
  );
}
