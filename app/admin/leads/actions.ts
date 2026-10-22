'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth';
import { resolveLeadAssignment, routingTransaction } from '@/lib/lead-routing';

export async function distributeUnassignedLeadsAction() {
  const actor = await requireRole(['ADMIN', 'DIRECTOR']);

  let assigned = 0;
  await routingTransaction(async (transaction) => {
    const unassignedLeads = await transaction.lead.findMany({
      where: { assignedToId: null, status: { notIn: ['WON', 'LOST'] } },
      select: { id: true, neighborhood: true, routingQueueId: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 25,
    });
    for (const lead of unassignedLeads) {
      const { assignee, routingQueueId } = await resolveLeadAssignment(
        transaction,
        lead.neighborhood,
        lead.routingQueueId || undefined,
      );
      if (!assignee) continue;

      const updated = await transaction.lead.updateMany({
        where: { id: lead.id, assignedToId: null },
        data: { assignedToId: assignee.id, routingQueueId },
      });
      if (updated.count === 0) continue;

      const assignedAt = new Date();
      assigned += 1;

      await transaction.user.update({
        where: { id: assignee.id },
        data: { lastLeadAssignedAt: assignedAt },
      });
      await transaction.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'NOTE',
          note: 'Lead distribuído pela fila assistida conforme disponibilidade, capacidade e região.',
        },
      });
      await transaction.auditLog.create({
        data: {
          action: 'lead.queue_assigned',
          entityType: 'Lead',
          entityId: lead.id,
          userId: actor.id,
          metadata: { newUserId: assignee.id, region: lead.neighborhood },
        },
      });
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/leads');
  revalidatePath('/admin/agenda');
  redirect(`/admin/leads?distribuidos=${assigned}`);
}
