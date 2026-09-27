import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const transaction = {
    passwordResetToken: { updateMany: vi.fn(), deleteMany: vi.fn() },
    user: { updateMany: vi.fn() },
    session: { deleteMany: vi.fn() },
  };
  const db = {
    user: { findUnique: vi.fn() },
    passwordResetToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (work: (tx: typeof transaction) => Promise<unknown>) =>
      work(transaction),
    ),
  };
  return { db, transaction };
});

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { createPasswordReset, resetPassword } from './auth';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('recuperação de senha', () => {
  it('preserva o link recente ao repetir a solicitação', async () => {
    mocks.db.user.findUnique.mockResolvedValue({ id: 'usuario-1', isActive: true });
    mocks.db.passwordResetToken.findFirst.mockResolvedValue({ id: 'link-ativo' });

    expect(await createPasswordReset(' USUARIO@EXAMPLE.COM ')).toBeNull();
    expect(mocks.db.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'usuario@example.com' },
    });
    expect(mocks.db.passwordResetToken.deleteMany).not.toHaveBeenCalled();
    expect(mocks.db.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('recusa link já consumido durante outro envio simultâneo', async () => {
    mocks.db.passwordResetToken.findUnique.mockResolvedValue({
      id: 'link-1',
      userId: 'usuario-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    mocks.transaction.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

    expect(await resetPassword('token', 'nova-senha-segura')).toBe(false);
    expect(mocks.transaction.user.updateMany).not.toHaveBeenCalled();
    expect(mocks.transaction.session.deleteMany).not.toHaveBeenCalled();
  });

  it('troca a senha somente para conta ativa e encerra as sessões', async () => {
    mocks.db.passwordResetToken.findUnique.mockResolvedValue({
      id: 'link-1',
      userId: 'usuario-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    mocks.transaction.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.user.updateMany.mockResolvedValue({ count: 1 });

    expect(await resetPassword('token', 'nova-senha-segura')).toBe(true);
    expect(mocks.transaction.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'usuario-1', isActive: true } }),
    );
    expect(mocks.transaction.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'usuario-1' },
    });
  });
});
