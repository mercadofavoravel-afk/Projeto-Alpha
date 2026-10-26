import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  lock: vi.fn(),
  campaigns: vi.fn(),
  brokers: vi.fn(),
  items: vi.fn(),
  changeLead: vi.fn(),
  changeItem: vi.fn(),
  count: vi.fn(),
  changeCampaign: vi.fn(),
  changeUser: vi.fn(),
  activity: vi.fn(),
  audit: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ db: { $transaction: mocks.transaction } }));
vi.mock('@/lib/lead-routing', () => ({ lockRouting: mocks.lock }));
import { processRepique } from './lead-repique';
const now = new Date('2026-10-26T12:00:00Z');
const broker = (id: string, load = 0, regions: string[] = []) => ({
  id,
  leadCapacity: 2,
  serviceRegions: regions,
  _count: { assignedLeads: load },
});
const item = (id: string, previous: string | null = null, changed = false) => ({
  id,
  expectedAssignedToId: previous,
  expectedUpdatedAt: now,
  lead: {
    id: `lead-${id}`,
    assignedToId: previous,
    updatedAt: changed ? new Date(now.getTime() + 1) : now,
    status: 'NEW',
    neighborhood: 'Leblon',
  },
});
describe('repique com intervalo e preservação do histórico', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((fn) =>
      fn({
        leadRepiqueCampaign: { findMany: mocks.campaigns, update: mocks.changeCampaign },
        user: { findMany: mocks.brokers, update: mocks.changeUser },
        leadRepiqueItem: { findMany: mocks.items, update: mocks.changeItem, count: mocks.count },
        lead: { updateMany: mocks.changeLead },
        leadActivity: { create: mocks.activity },
        auditLog: { create: mocks.audit },
      }),
    );
    mocks.campaigns.mockResolvedValue([
      {
        id: 'queue',
        name: 'Lista',
        brokerIds: ['a', 'b'],
        cursor: 0,
        intervalMinutes: 3,
        mode: 'ONE',
        createdById: 'admin',
      },
    ]);
    mocks.brokers.mockResolvedValue([broker('a'), broker('b')]);
    mocks.items.mockResolvedValue([item('1'), item('2'), item('3')]);
    mocks.changeLead.mockResolvedValue({ count: 1 });
    mocks.count.mockResolvedValue(2);
  });
  it('distribui um lead por intervalo e não recupera atrasos em rajada', async () => {
    expect((await processRepique(now)).delivered).toBe(1);
    expect(mocks.changeLead).toHaveBeenCalledTimes(1);
    expect(mocks.changeCampaign).toHaveBeenCalledWith({
      where: { id: 'queue' },
      data: { cursor: 1, status: 'RUNNING', nextRunAt: new Date(now.getTime() + 180000) },
    });
    expect(mocks.lock).toHaveBeenCalledTimes(1);
    expect(mocks.campaigns).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'RUNNING', nextRunAt: { lte: now } } }),
    );
  });
  it('uma rodada entrega no máximo um para cada corretor selecionado', async () => {
    mocks.campaigns.mockResolvedValue([
      {
        id: 'queue',
        name: 'Lista',
        brokerIds: ['a', 'b'],
        cursor: 0,
        intervalMinutes: 30,
        mode: 'ROUND',
        createdById: 'admin',
      },
    ]);
    expect((await processRepique(now)).delivered).toBe(2);
    expect(mocks.changeLead.mock.calls.map((c) => c[0].data.assignedToId)).toEqual(['a', 'b']);
  });
  it('preserva alterações posteriores e registra item ignorado', async () => {
    mocks.items.mockResolvedValue([item('1', 'a', true)]);
    expect((await processRepique(now)).skipped).toBe(1);
    expect(mocks.changeLead).not.toHaveBeenCalled();
    expect(mocks.changeItem).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'SKIPPED' }) }),
    );
  });
  it('respeita capacidade e região, mantendo o lead pendente quando não há elegível', async () => {
    mocks.brokers.mockResolvedValue([broker('a', 2), broker('b', 0, ['Tijuca'])]);
    expect((await processRepique(now)).delivered).toBe(0);
    expect(mocks.changeLead).not.toHaveBeenCalled();
  });
  it('evita o responsável anterior e registra ambos na auditoria', async () => {
    mocks.items.mockResolvedValue([item('1', 'a')]);
    await processRepique(now);
    expect(mocks.audit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: { campaignId: 'queue', previousUserId: 'a', newUserId: 'b' },
      }),
    });
  });
  it('não registra entrega se a atualização condicional perder a disputa', async () => {
    mocks.changeLead.mockResolvedValue({ count: 0 });
    await processRepique(now);
    expect(mocks.changeItem).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it('conclui uma campanha sem pendências e não processa fila pausada', async () => {
    mocks.count.mockResolvedValue(0);
    await processRepique(now);
    expect(mocks.changeCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'COMPLETED', nextRunAt: null }),
      }),
    );
    mocks.campaigns.mockResolvedValue([]);
    expect((await processRepique(now)).delivered).toBe(0);
  });
});
