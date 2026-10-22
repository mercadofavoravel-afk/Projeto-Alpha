import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  role: vi.fn(),
  target: vi.fn(),
  transaction: vi.fn(),
  update: vi.fn(),
  audit: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({ requireRole: mocks.role }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock('@/lib/db', () => ({
  db: { user: { findUnique: mocks.target }, $transaction: mocks.transaction },
}));

import { updateEmployee } from './actions';

function form(scope: string, regions: string) {
  const data = new FormData();
  Object.entries({
    userId: 'consultant-1',
    role: 'CONSULTANT',
    isActive: 'true',
    acceptsLeads: 'true',
    leadCapacity: '30',
    routingScope: scope,
    serviceRegions: regions,
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe('salvar abrangência de recebimento', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.role.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mocks.target.mockResolvedValue({ role: 'CONSULTANT' });
    mocks.transaction.mockImplementation((run) =>
      run({ user: { update: mocks.update }, auditLog: { create: mocks.audit } }),
    );
  });
  it('recusa uma fila regional vazia sem alterar cadastro nem permissões', async () => {
    await expect(updateEmployee(form('REGIONAL', ' , '))).rejects.toThrow('result=routing');
    expect(mocks.target).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('permite trocar para fila geral e registra a alteração sem filtros antigos', async () => {
    await expect(updateEmployee(form('ALL', 'Leblon'))).rejects.toThrow('result=updated');
    expect(mocks.role).toHaveBeenCalledWith(['ADMIN', 'DIRECTOR']);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ serviceRegions: [], acceptsLeads: true }),
      }),
    );
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'user.updated',
          metadata: expect.objectContaining({ serviceRegions: [] }),
        }),
      }),
    );
  });
  it('salva uma fila regional normalizada mantendo o recebimento habilitado', async () => {
    await expect(updateEmployee(form('REGIONAL', ' Gávea, gavea, Ipanema '))).rejects.toThrow(
      'result=updated',
    );
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ serviceRegions: ['Gávea', 'Ipanema'], acceptsLeads: true }),
      }),
    );
  });
});
