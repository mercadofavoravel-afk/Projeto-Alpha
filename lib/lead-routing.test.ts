import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma, LeadRouletteQueue } from '@prisma/client';
import { DEFAULT_SHIFTS } from './roulette-rules';
vi.mock('@/lib/db', () => ({ db: {} }));
import { checkInRoulette, ensureRouletteDraw, resolveLeadAssignment } from './lead-routing';
const now = new Date('2026-10-22T12:05:00Z');
const queue = {
  id: 'queue',
  enabled: true,
  shifts: DEFAULT_SHIFTS,
  regions: [],
  name: 'Geral',
} as unknown as LeadRouletteQueue;
function fixture() {
  const entries = [
    { id: 'e1', userId: 'a', position: 0, checkedOutAt: null, lastSeenAt: now },
    { id: 'e2', userId: 'b', position: 1, checkedOutAt: null, lastSeenAt: now },
  ];
  const shift = { id: 'shift', drawnAt: now, nextPosition: 0, entries };
  const tx = {
    $executeRaw: vi.fn(),
    leadRouletteQueue: { findMany: vi.fn().mockResolvedValue([queue]) },
    leadRouletteShift: {
      upsert: vi.fn().mockResolvedValue(shift),
      update: vi.fn().mockImplementation(async ({ data }) => Object.assign(shift, data)),
      findUniqueOrThrow: vi.fn().mockResolvedValue(shift),
    },
    leadRouletteEntry: { update: vi.fn(), upsert: vi.fn() },
    user: {
      findMany: vi.fn().mockResolvedValue(
        ['a', 'b'].map((id) => ({
          id,
          leadCapacity: 10,
          serviceRegions: [],
          lastLeadAssignedAt: null,
          _count: { assignedLeads: 0 },
        })),
      ),
    },
    auditLog: { create: vi.fn() },
  };
  return { tx, client: tx as unknown as Prisma.TransactionClient, shift, entries };
}
beforeEach(() => vi.clearAllMocks());
describe('roleta transacional', () => {
  it('avança a ordem e volta ao início em recebimentos sucessivos', async () => {
    const { client } = fixture();
    const results: (string | undefined)[] = [];
    for (let i = 0; i < 4; i++)
      results.push((await resolveLeadAssignment(client, 'Leblon', undefined, now)).assignee?.id);
    expect(results).toEqual(['a', 'b', 'a', 'b']);
  });
  it('pula ausência, região incompatível e capacidade esgotada', async () => {
    const { client, entries, tx } = fixture();
    entries[0].lastSeenAt = new Date(now.getTime() - 180001);
    expect((await resolveLeadAssignment(client, 'Leblon', undefined, now)).assignee?.id).toBe('b');
    tx.user.findMany.mockResolvedValue([
      {
        id: 'b',
        leadCapacity: 1,
        serviceRegions: ['Barra'],
        lastLeadAssignedAt: null,
        _count: { assignedLeads: 0 },
      },
    ]);
    expect((await resolveLeadAssignment(client, 'Leblon', undefined, now)).assignee).toBeNull();
    tx.user.findMany.mockResolvedValue([
      {
        id: 'b',
        leadCapacity: 1,
        serviceRegions: [],
        lastLeadAssignedAt: null,
        _count: { assignedLeads: 1 },
      },
    ]);
    expect((await resolveLeadAssignment(client, 'Leblon', undefined, now)).assignee).toBeNull();
  });
  it('retém leads no intervalo ou em fila pausada sem usar distribuição antiga', async () => {
    const { client, tx } = fixture();
    expect(
      await resolveLeadAssignment(client, 'Leblon', undefined, new Date('2026-10-22T17:10:00Z')),
    ).toEqual({ assignee: null, routingQueueId: 'queue' });
    tx.leadRouletteQueue.findMany.mockResolvedValue([{ ...queue, enabled: false }]);
    expect((await resolveLeadAssignment(client, 'Leblon', undefined, now)).assignee).toBeNull();
    expect(tx.leadRouletteShift.upsert).not.toHaveBeenCalled();
  });
  it('não sorteia novamente um plantão já consolidado', async () => {
    const { client, tx } = fixture();
    await ensureRouletteDraw(client, queue, now);
    await ensureRouletteDraw(client, queue, now);
    expect(tx.leadRouletteEntry.update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });
  it('entrada tardia vai ao fim e retorno mantém a posição original', async () => {
    const { client, tx } = fixture();
    await checkInRoulette(client, queue, 'c', now);
    expect(tx.leadRouletteEntry.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ userId: 'c', position: 2 }) }),
    );
    await checkInRoulette(client, queue, 'a', now);
    expect(tx.leadRouletteEntry.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ position: 0, checkedOutAt: null }),
      }),
    );
  });
  it('primeiro sorteio usa todos os inscritos uma única vez', async () => {
    const { client, tx, shift } = fixture();
    shift.drawnAt = null as unknown as Date;
    await ensureRouletteDraw(client, queue, now);
    await ensureRouletteDraw(client, queue, now);
    expect(tx.leadRouletteEntry.update).toHaveBeenCalledTimes(2);
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
    expect(
      new Set(tx.leadRouletteEntry.update.mock.calls.map(([arg]) => arg.data.position)),
    ).toEqual(new Set([0, 1]));
  });
});
