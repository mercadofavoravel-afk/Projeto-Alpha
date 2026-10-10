'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { chooseAssignee, type DistributionCandidate } from '@/lib/lead-distribution';
import { assignableSubscriptionWhere } from '@/lib/commercial-subscription';

export async function distributeUnassignedLeadsAction() {
  const actor = await requireRole(['ADMIN', 'DIRECTOR']);

  const [unassignedLeads, users] = await Promise.all([
    db.lead.findMany({
      where: { assignedToId: null, status: { notIn: ['WON', 'LOST'] } },
      select: { id: true, neighborhood: true },
      orderBy: { createdAt: 'asc' },
      take: 25,
    }),
    db.user.findMany({
      where: {
        isActive: true,
        acceptsLeads: true,
        ...assignableSubscriptionWhere(),
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
  ]);

  const candidates: DistributionCandidate[] = users.map((user) => ({
    id: user.id,
    activeLeadCount: user._count.assignedLeads,
    leadCapacity: user.leadCapacity,
    serviceRegions: user.serviceRegions,
    lastLeadAssignedAt: user.lastLeadAssignedAt,
  }));

  let assigned = 0;
  await db.$transaction(async (transaction) => {
    for (const lead of unassignedLeads) {
      const assignee = chooseAssignee(candidates, lead.neighborhood);
      if (!assignee) continue;

      const updated = await transaction.lead.updateMany({
        where: { id: lead.id, assignedToId: null },
        data: { assignedToId: assignee.id },
      });
      if (updated.count === 0) continue;

      const assignedAt = new Date();
      assignee.activeLeadCount += 1;
      assignee.lastLeadAssignedAt = assignedAt;
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
