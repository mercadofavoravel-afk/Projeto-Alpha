import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  compare: vi.fn(),
  hash: vi.fn(),
  transaction: vi.fn(),
  lock: vi.fn(),
  checkout: vi.fn(),
  update: vi.fn(),
  sessions: vi.fn(),
  tokens: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({ requireUser: mocks.user }));
vi.mock('bcryptjs', () => ({ default: { compare: mocks.compare, hash: mocks.hash } }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock('@/lib/db', () => ({ db: { $transaction: mocks.transaction } }));
import { changeOwnPassword } from './actions';
function form() {
  const data = new FormData();
  data.set('currentPassword', 'initial-password');
  data.set('newPassword', 'my-new-password');
  data.set('confirmPassword', 'my-new-password');
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: 'self', passwordHash: 'stored-hash' });
  mocks.compare.mockResolvedValue(true);
  mocks.hash.mockResolvedValue('new-hash');
  mocks.transaction.mockImplementation(async (callback) =>
    callback({
      $executeRaw: mocks.lock,
      leadRouletteEntry: { updateMany: mocks.checkout },
      user: { update: mocks.update },
      session: { deleteMany: mocks.sessions },
      passwordResetToken: { deleteMany: mocks.tokens },
    }),
  );
});
describe('senha própria do corretor', () => {
  it('valida a senha atual antes de alterar qualquer registro', async () => {
    mocks.compare.mockResolvedValue(false);
    await expect(changeOwnPassword(form())).rejects.toThrow('result=current');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('troca somente a própria senha, encerra sessões e participações anteriores', async () => {
    await expect(changeOwnPassword(form())).rejects.toThrow('redirect:/login');
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'self' },
        data: expect.objectContaining({ passwordHash: 'new-hash' }),
      }),
    );
    expect(mocks.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'self', checkedOutAt: null } }),
    );
    expect(mocks.sessions).toHaveBeenCalledWith({ where: { userId: 'self' } });
  });
});
