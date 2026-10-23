import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  role: vi.fn(),
  catalog: vi.fn(),
  save: vi.fn(),
  audit: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({ requireRole: mocks.role }));
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/lead-routing', () => ({ routingTransaction: mocks.transaction }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(url);
  },
}));
import { saveRespondiLanding } from './actions';
function form() {
  const data = new FormData();
  Object.entries({
    formId: 'form123',
    name: 'Copacabana',
    pageUrl: 'https://imoveisdealtopadraorio.com.br/studios-copacabana/',
    neighborhood: 'Copacabana',
    field_name: 'Nome',
    field_phone: 'Telefone',
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.role.mockResolvedValue({ id: 'director' });
  mocks.catalog.mockResolvedValue(null);
  mocks.save.mockResolvedValue({ id: 'mapping' });
  mocks.transaction.mockImplementation((work) =>
    work({
      articleLeadIntegration: { findUnique: mocks.catalog },
      respondiLandingIntegration: { upsert: mocks.save },
      auditLog: { create: mocks.audit },
    }),
  );
});
describe('gestão de formulários comerciais', () => {
  it('checks management role before reading or changing configuration', async () => {
    mocks.role.mockRejectedValue(new Error('denied'));
    await expect(saveRespondiLanding(form())).rejects.toThrow('denied');
    expect(mocks.role).toHaveBeenCalledWith(['ADMIN', 'DIRECTOR']);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('refuses forms already belonging to an article', async () => {
    mocks.catalog.mockResolvedValue({ id: 'article' });
    await expect(saveRespondiLanding(form())).rejects.toThrow('result=conflict');
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('saves a paused mapping by default and records who configured it', async () => {
    await expect(saveRespondiLanding(form())).rejects.toThrow('result=saved');
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          enabled: false,
          fields: expect.objectContaining({ name: 'Nome', phone: 'Telefone' }),
        }),
      }),
    );
    expect(mocks.audit).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'director', action: 'respondi.landing_configured' }),
    });
  });
});
