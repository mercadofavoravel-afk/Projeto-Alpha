import 'server-only';
import { db } from '@/lib/db';
import { lockRouting } from '@/lib/lead-routing';
import { candidateCanReceive } from '@/lib/lead-distribution';

export async function processRepique(now = new Date()) {
  return db.$transaction(
    async (tx) => {
      await lockRouting(tx);
      const campaigns = await tx.leadRepiqueCampaign.findMany({
        where: { status: 'RUNNING', nextRunAt: { lte: now } },
        orderBy: { nextRunAt: 'asc' },
        take: 20,
      });
      let delivered = 0,
        skipped = 0;
      for (const campaign of campaigns) {
        const brokers = await tx.user.findMany({
          where: {
            id: { in: campaign.brokerIds },
            isActive: true,
            acceptsLeads: true,
            role: { in: ['DIRECTOR', 'MANAGER', 'CONSULTANT'] },
          },
          include: {
            _count: {
              select: { assignedLeads: { where: { status: { notIn: ['WON', 'LOST'] } } } },
            },
          },
        });
        const byId = new Map(
          brokers.map((b) => [b.id, { ...b, activeLeadCount: b._count.assignedLeads }]),
        );
        const pending = await tx.leadRepiqueItem.findMany({
          where: { campaignId: campaign.id, status: 'PENDING' },
          include: { lead: true },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: 2000,
        });
        const used = new Set<string>();
        let cursor = campaign.cursor,
          sent = 0;
        for (const item of pending) {
          if (sent >= (campaign.mode === 'ROUND' ? campaign.brokerIds.length : 1)) break;
          const lead = item.lead;
          if (
            ['WON', 'LOST'].includes(lead.status) ||
            lead.assignedToId !== item.expectedAssignedToId ||
            lead.updatedAt.getTime() !== item.expectedUpdatedAt.getTime()
          ) {
            await tx.leadRepiqueItem.update({
              where: { id: item.id },
              data: {
                status: 'SKIPPED',
                reason: 'Lead encerrado ou alterado após a preparação da fila.',
              },
            });
            skipped++;
            continue;
          }
          let recipient: (typeof brokers)[number] | undefined;
          for (let offset = 0; offset < campaign.brokerIds.length; offset++) {
            const index = (cursor + offset) % campaign.brokerIds.length;
            const candidate = byId.get(campaign.brokerIds[index]);
            if (
              candidate &&
              candidate.id !== lead.assignedToId &&
              !used.has(candidate.id) &&
              candidateCanReceive(candidate, lead.neighborhood)
            ) {
              recipient = candidate;
              cursor = (index + 1) % campaign.brokerIds.length;
              break;
            }
          }
          if (!recipient) continue;
          const changed = await tx.lead.updateMany({
            where: {
              id: lead.id,
              assignedToId: item.expectedAssignedToId,
              updatedAt: item.expectedUpdatedAt,
              status: { notIn: ['WON', 'LOST'] },
            },
            data: { assignedToId: recipient.id, routingQueueId: null },
          });
          if (changed.count !== 1) continue;
          await tx.leadRepiqueItem.update({
            where: { id: item.id },
            data: {
              status: 'DELIVERED',
              assignedToId: recipient.id,
              deliveredAt: now,
              reason: null,
            },
          });
          await tx.user.update({ where: { id: recipient.id }, data: { lastLeadAssignedAt: now } });
          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              type: 'NOTE',
              note: `Repique: ${campaign.name}. Responsável anterior: ${lead.assignedToId || 'sem responsável'}. Novo responsável: ${recipient.id}.`,
            },
          });
          await tx.auditLog.create({
            data: {
              action: 'lead.repique_assigned',
              entityType: 'Lead',
              entityId: lead.id,
              userId: campaign.createdById,
              metadata: {
                campaignId: campaign.id,
                previousUserId: lead.assignedToId,
                newUserId: recipient.id,
              },
            },
          });
          byId.get(recipient.id)!.activeLeadCount++;
          if (lead.assignedToId && byId.has(lead.assignedToId))
            byId.get(lead.assignedToId)!.activeLeadCount--;
          used.add(recipient.id);
          sent++;
          delivered++;
        }
        const remaining = await tx.leadRepiqueItem.count({
          where: { campaignId: campaign.id, status: 'PENDING' },
        });
        await tx.leadRepiqueCampaign.update({
          where: { id: campaign.id },
          data: {
            cursor,
            status: remaining ? 'RUNNING' : 'COMPLETED',
            nextRunAt: remaining
              ? new Date(now.getTime() + campaign.intervalMinutes * 60_000)
              : null,
          },
        });
      }
      return { delivered, skipped, campaigns: campaigns.length };
    },
    { timeout: 60_000 },
  );
}
