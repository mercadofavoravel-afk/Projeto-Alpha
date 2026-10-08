import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), count: vi.fn() }));

vi.mock('@/lib/auth', () => ({ requireApiPermission: mocks.auth }));
vi.mock('@/lib/db', () => ({ db: { lead: { count: mocks.count } } }));

import { GET } from './route';

describe('alertas ativos do CRM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ ok: true, user: { id: 'corretor-1', role: 'CONSULTANT' } });
    mocks.count.mockResolvedValue(2);
  });

  it('recusa consulta sem sessão', async () => {
    mocks.auth.mockResolvedValue({ ok: false, error: 'Não autorizado', status: 401 });
    expect((await GET()).status).toBe(401);
    expect(mocks.count).not.toHaveBeenCalled();
  });

  it('consulta apenas os leads atribuídos ao corretor e não inclui a fila global', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual({
      firstContact: 2,
      overdueFollowUp: 2,
      stalled: 2,
    });
    for (const call of mocks.count.mock.calls) {
      expect(call[0].where.AND).toContainEqual({ assignedToId: 'corretor-1' });
    }
  });
});
