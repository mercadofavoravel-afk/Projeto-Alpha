import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mocks = vi.hoisted(() => ({ permission: vi.fn(), groups: vi.fn(), leads: vi.fn() }));
vi.mock('@/lib/auth', () => ({ requirePermission: mocks.permission }));
vi.mock('@/lib/db', () => ({ db: { lead: { groupBy: mocks.groups, findMany: mocks.leads } } }));
import LeadKanbanPage from './page';

describe('Kanban completo e isolado por carteira', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.permission.mockResolvedValue({ id: 'broker-1', role: 'CONSULTANT' });
    mocks.groups.mockResolvedValue([
      { status: 'NEW', _count: { _all: 251 } },
      { status: 'WON', _count: { _all: 40 } },
    ]);
    mocks.leads.mockImplementation(({ where, skip }) =>
      Promise.resolve([
        {
          id: `${where.AND[1].status}-${skip}`,
          name: `Contato ${skip + 1}`,
          status: where.AND[1].status,
          neighborhood: 'Ipanema',
          source: 'Site',
          _count: { activities: 3 },
        },
      ]),
    );
  });
  it('mostra totais completos e carrega a última página de uma etapa', async () => {
    const html = renderToStaticMarkup(
      await LeadKanbanPage({ searchParams: Promise.resolve({ page_NEW: '11' }) }),
    );
    expect(html).toContain('<b>251</b>');
    expect(html).toContain('<b>40</b>');
    expect(html).toContain('Contato 251');
    expect(html).toContain('Página 11 de 11');
    expect(html).toContain('page_NEW=10');
    expect(mocks.leads).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ assignedToId: 'broker-1' }, { status: 'NEW' }] },
        skip: 250,
        take: 25,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(mocks.groups).toHaveBeenCalledWith(
      expect.objectContaining({ where: { assignedToId: 'broker-1' } }),
    );
  });
  it('restringe contagens e cartões do gerente à própria equipe', async () => {
    mocks.permission.mockResolvedValue({ id: 'manager-1', role: 'MANAGER' });
    await LeadKanbanPage({ searchParams: Promise.resolve({ page_NEW: ['1', '2'] }) });
    const scope = {
      OR: [{ assignedToId: 'manager-1' }, { assignedTo: { managerId: 'manager-1' } }],
    };
    expect(mocks.groups).toHaveBeenCalledWith(expect.objectContaining({ where: scope }));
    for (const [query] of mocks.leads.mock.calls) expect(query.where.AND[0]).toEqual(scope);
    expect(mocks.leads.mock.calls[0][0].skip).toBe(0);
  });
  it('não consulta cadastros antes de autenticar e autorizar', async () => {
    mocks.permission.mockRejectedValue(new Error('redirect'));
    await expect(LeadKanbanPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('redirect');
    expect(mocks.groups).not.toHaveBeenCalled();
    expect(mocks.leads).not.toHaveBeenCalled();
  });
});
