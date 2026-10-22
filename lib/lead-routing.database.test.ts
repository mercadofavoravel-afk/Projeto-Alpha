import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { db } from './db';
import {
  checkInRoulette,
  processRouletteQueues,
  resolveLeadAssignment,
  routingTransaction,
} from './lead-routing';
const enabled = process.env.ROULETTE_DATABASE_TESTS === '1';
const tag = `roulette-${randomUUID()}`;
let queueId: string | undefined;
const users: string[] = [];
const leads: string[] = [];
describe.runIf(enabled)('roleta no PostgreSQL isolado de testes', () => {
  it('serializa entradas simultâneas, respeita capacidade e preserva leads antigos', async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.includes('test'))
      throw new Error('Este teste só executa em banco local de testes.');
    const now = new Date('2026-10-22T12:00:00Z');
    const before = new Date(now.getTime() - 60_000);
    const queue = await db.leadRouletteQueue.create({
      data: {
        name: tag,
        regions: [tag],
        enabled: true,
        shifts: [{ name: 'Diário', start: 540, end: 540 }],
      },
    });
    queueId = queue.id;
    for (let i = 0; i < 2; i++) {
      const user = await db.user.create({
        data: {
          email: `${tag}-${i}@example.invalid`,
          passwordHash: 'not-a-login-password',
          role: 'CONSULTANT',
          acceptsLeads: true,
          leadCapacity: 1,
          serviceRegions: [tag],
        },
      });
      users.push(user.id);
      await routingTransaction((tx) => checkInRoulette(tx, queue, user.id, before));
    }
    const outcomes = await Promise.all(
      Array.from({ length: 3 }, () =>
        routingTransaction(async (tx) => {
          const result = await resolveLeadAssignment(tx, tag, undefined, now);
          const lead = await tx.lead.create({
            data: {
              name: tag,
              phone: 'test-only',
              consent: true,
              neighborhood: tag,
              assignedToId: result.assignee?.id,
              routingQueueId: result.routingQueueId,
            },
          });
          leads.push(lead.id);
          return lead;
        }),
      ),
    );
    expect(new Set(outcomes.filter((l) => l.assignedToId).map((l) => l.assignedToId)).size).toBe(2);
    expect(outcomes.filter((l) => !l.assignedToId)).toHaveLength(1);
    expect(
      await db.auditLog.count({
        where: { action: 'roulette.drawn', metadata: { path: ['queueId'], equals: queue.id } },
      }),
    ).toBe(1);
    const old = await db.lead.create({
      data: { name: tag, phone: 'test-only', consent: true, neighborhood: tag },
    });
    leads.push(old.id);
    // Release capacity; a subsequent online pulse drains only the explicitly queued lead.
    await db.lead.updateMany({
      where: { id: { in: outcomes.filter((l) => l.assignedToId).map((l) => l.id) } },
      data: { status: 'WON' },
    });
    expect((await processRouletteQueues(now)).assigned).toBe(1);
    expect((await db.lead.findUniqueOrThrow({ where: { id: old.id } })).assignedToId).toBeNull();
  }, 30_000);
  afterAll(async () => {
    if (!queueId) return;
    await db.leadActivity.deleteMany({ where: { leadId: { in: leads } } });
    await db.lead.deleteMany({ where: { id: { in: leads } } });
    await db.leadRouletteEntry.deleteMany({ where: { shift: { queueId } } });
    await db.leadRouletteShift.deleteMany({ where: { queueId } });
    await db.leadRouletteQueue.delete({ where: { id: queueId } });
    await db.auditLog.deleteMany({
      where: {
        OR: [
          { userId: { in: users } },
          { entityId: { in: leads } },
          { metadata: { path: ['queueId'], equals: queueId } },
        ],
      },
    });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  });
});
