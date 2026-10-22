import { randomInt } from 'node:crypto';
import { Prisma, type LeadRouletteQueue } from '@prisma/client';
import { db } from '@/lib/db';
import {
  candidateCanReceive,
  chooseAssignee,
  type DistributionCandidate,
} from '@/lib/lead-distribution';
import {
  currentShift,
  matchingQueue,
  nextInRotation,
  PRESENCE_TTL_MS,
  registrationShift,
  shiftsSchema,
  shuffled,
} from '@/lib/roulette-rules';

type Transaction = Prisma.TransactionClient;

export async function lockRouting(tx: Transaction) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('alpha:lead-routing'))`;
}

export async function routingTransaction<T>(operation: (tx: Transaction) => Promise<T>) {
  return db.$transaction(
    async (tx) => {
      await lockRouting(tx);
      return operation(tx);
    },
    { timeout: 20_000 },
  );
}

async function candidates(tx: Transaction): Promise<DistributionCandidate[]> {
  const users = await tx.user.findMany({
    where: {
      isActive: true,
      acceptsLeads: true,
      role: { in: ['DIRECTOR', 'MANAGER', 'CONSULTANT'] },
    },
    select: {
      id: true,
      leadCapacity: true,
      serviceRegions: true,
      lastLeadAssignedAt: true,
      _count: { select: { assignedLeads: { where: { status: { notIn: ['WON', 'LOST'] } } } } },
    },
  });
  return users.map((u) => ({ ...u, activeLeadCount: u._count.assignedLeads }));
}

// All callers hold the routing transaction lock before creating or advancing a draw.
export async function ensureRouletteDraw(tx: Transaction, queue: LeadRouletteQueue, now: Date) {
  if (!queue.enabled) return null;
  const parsed = shiftsSchema.safeParse(queue.shifts);
  if (!parsed.success) return null; // Invalid configuration holds leads; never bypass the queue.
  const window = currentShift(now, parsed.data);
  if (!window) return null;
  let shift = await tx.leadRouletteShift.upsert({
    where: { queueId_startsAt: { queueId: queue.id, startsAt: window.startsAt } },
    create: { queueId: queue.id, ...window },
    update: {},
    include: { entries: true },
  });
  if (!shift.drawnAt) {
    const ordered = shuffled(
      shift.entries.filter((e) => !e.checkedOutAt),
      randomInt,
    );
    for (let position = 0; position < ordered.length; position++) {
      await tx.leadRouletteEntry.update({
        where: { id: ordered[position].id },
        data: { position },
      });
    }
    await tx.leadRouletteShift.update({ where: { id: shift.id }, data: { drawnAt: now } });
    await tx.auditLog.create({
      data: {
        action: 'roulette.drawn',
        entityType: 'LeadRouletteShift',
        entityId: shift.id,
        metadata: {
          queueId: queue.id,
          startsAt: window.startsAt.toISOString(),
          order: ordered.map((e) => e.userId),
        },
      },
    });
    shift = await tx.leadRouletteShift.findUniqueOrThrow({
      where: { id: shift.id },
      include: { entries: true },
    });
  }
  return shift;
}

export async function resolveLeadAssignment(
  tx: Transaction,
  region?: string | null,
  queuedId?: string,
  now = new Date(),
) {
  await lockRouting(tx);
  const queues = await tx.leadRouletteQueue.findMany({ orderBy: { id: 'asc' } });
  const queue = queuedId ? queues.find((q) => q.id === queuedId) : matchingQueue(queues, region);
  const available = await candidates(tx);
  if (!queue) {
    return {
      assignee: queuedId ? null : chooseAssignee(available, region),
      routingQueueId: queuedId ?? null,
    };
  }
  const shift = await ensureRouletteDraw(tx, queue, now);
  if (!shift) return { assignee: null, routingQueueId: queue.id };
  const byId = new Map(available.map((c) => [c.id, c]));
  const entry = nextInRotation(shift.entries, shift.nextPosition, (e) => {
    const person = byId.get(e.userId);
    return (
      !e.checkedOutAt &&
      e.lastSeenAt.getTime() >= now.getTime() - PRESENCE_TTL_MS &&
      !!person &&
      candidateCanReceive(person, region)
    );
  });
  if (!entry) return { assignee: null, routingQueueId: queue.id };
  await tx.leadRouletteShift.update({
    where: { id: shift.id },
    data: { nextPosition: entry.position! + 1 },
  });
  await tx.auditLog.create({
    data: {
      action: 'roulette.turn',
      entityType: 'LeadRouletteShift',
      entityId: shift.id,
      metadata: {
        queueId: queue.id,
        userId: entry.userId,
        position: entry.position,
        region: region ?? null,
      },
    },
  });
  return { assignee: byId.get(entry.userId)!, routingQueueId: queue.id };
}

export async function checkInRoulette(
  tx: Transaction,
  queue: LeadRouletteQueue,
  userId: string,
  now = new Date(),
) {
  if (!queue.enabled) throw new Error('Fila pausada.');
  const parsed = shiftsSchema.safeParse(queue.shifts);
  if (!parsed.success) throw new Error('Horários inválidos.');
  const window = registrationShift(now, parsed.data);
  if (!window) throw new Error('Check-in abre 30 minutos antes de cada plantão.');
  // Draw the current shift before accepting a late arrival; initial registrations are shuffled once.
  if (window.startsAt <= now) await ensureRouletteDraw(tx, queue, now);
  const shift = await tx.leadRouletteShift.upsert({
    where: { queueId_startsAt: { queueId: queue.id, startsAt: window.startsAt } },
    create: { queueId: queue.id, ...window },
    update: {},
    include: { entries: true },
  });
  const previous = shift.entries.find((e) => e.userId === userId);
  const position =
    previous?.position ??
    (shift.drawnAt ? Math.max(-1, ...shift.entries.map((e) => e.position ?? -1)) + 1 : null);
  await tx.leadRouletteEntry.upsert({
    where: { shiftId_userId: { shiftId: shift.id, userId } },
    create: { shiftId: shift.id, userId, position, lastSeenAt: now, checkedInAt: now },
    update: { checkedOutAt: null, lastSeenAt: now, position },
  });
  await tx.auditLog.create({
    data: {
      action: 'roulette.checkin',
      entityType: 'LeadRouletteShift',
      entityId: shift.id,
      userId,
      metadata: { queueId: queue.id, late: !!shift.drawnAt, position },
    },
  });
  return shift.id;
}

// Only new leads explicitly held by a roulette are eligible. Historical unassigned leads are untouched.
export async function processRouletteQueues(now = new Date()) {
  return routingTransaction(async (tx) => {
    const queues = await tx.leadRouletteQueue.findMany({ where: { enabled: true } });
    const available = await candidates(tx);
    const shifts = new Map<string, Awaited<ReturnType<typeof ensureRouletteDraw>>>();
    for (const queue of queues) shifts.set(queue.id, await ensureRouletteDraw(tx, queue, now));
    // Group by region before selecting the batch: an unavailable region must not
    // block eligible leads in other queues behind the first 25 waiting contacts.
    const groups = await tx.lead.groupBy({
      by: ['routingQueueId', 'neighborhood'],
      where: {
        routingQueueId: { in: queues.map((q) => q.id) },
        assignedToId: null,
        status: { notIn: ['WON', 'LOST'] },
      },
    });
    const eligibleGroups = groups.filter((group) => {
      const shift = group.routingQueueId ? shifts.get(group.routingQueueId) : null;
      return (
        shift &&
        shift.entries.some(
          (entry: {
            userId: string;
            checkedOutAt: Date | null;
            lastSeenAt: Date;
            position: number | null;
          }) =>
            entry.position !== null &&
            !entry.checkedOutAt &&
            entry.lastSeenAt.getTime() >= now.getTime() - PRESENCE_TTL_MS &&
            available.some(
              (person) =>
                person.id === entry.userId && candidateCanReceive(person, group.neighborhood),
            ),
        )
      );
    });
    const pending = eligibleGroups.length
      ? await tx.lead.findMany({
          where: {
            OR: eligibleGroups.map((group) => ({
              routingQueueId: group.routingQueueId,
              neighborhood: group.neighborhood,
            })),
            assignedToId: null,
            status: { notIn: ['WON', 'LOST'] },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: 25,
          select: { id: true, neighborhood: true, routingQueueId: true },
        })
      : [];
    let assigned = 0;
    for (const lead of pending) {
      const { assignee } = await resolveLeadAssignment(
        tx,
        lead.neighborhood,
        lead.routingQueueId!,
        now,
      );
      if (!assignee) continue;
      await tx.lead.update({ where: { id: lead.id }, data: { assignedToId: assignee.id } });
      await tx.user.update({ where: { id: assignee.id }, data: { lastLeadAssignedAt: now } });
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'NOTE',
          note: 'Lead distribuído automaticamente pela roleta do plantão.',
        },
      });
      await tx.auditLog.create({
        data: {
          action: 'lead.roulette_assigned',
          entityType: 'Lead',
          entityId: lead.id,
          metadata: { queueId: lead.routingQueueId, assignedToId: assignee.id },
        },
      });
      assigned++;
    }
    return { assigned, scanned: pending.length };
  });
}
