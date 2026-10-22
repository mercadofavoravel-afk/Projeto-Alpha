import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  role: vi.fn(),
  create: vi.fn(),
  audit: vi.fn(),
  send: vi.fn(),
  reset: vi.fn(),
  revoke: vi.fn(),
  sendReset: vi.fn(),
  target: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({
  requireRole: mocks.role,
  createPasswordReset: mocks.reset,
  revokePasswordReset: mocks.revoke,
}));
vi.mock('@/lib/email', () => ({
  sendEmployeeAccessEmail: mocks.send,
  sendPasswordResetEmail: mocks.sendReset,
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: mocks.target },
    auditLog: { create: mocks.audit },
    $transaction: async (work: (tx: unknown) => unknown) =>
      work({ user: { create: mocks.create }, auditLog: { create: mocks.audit } }),
  },
}));
import { createEmployee, sendEmployeeAccessLink } from './actions';
function form() {
  const data = new FormData();
  Object.entries({
    name: 'Corretor Teste',
    email: 'CORRETOR@EXAMPLE.COM',
    role: 'CONSULTANT',
    routingScope: 'ALL',
    leadCapacity: '30',
    acceptsLeads: 'true',
  }).forEach(([k, v]) => data.set(k, v));
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('RESEND_API_KEY', 'test-only');
  vi.stubEnv('EMAIL_FROM', 'test@example.com');
  mocks.role.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  mocks.create.mockResolvedValue({ id: 'cnewuser000000000000000001' });
  mocks.audit.mockResolvedValue({});
  mocks.send.mockResolvedValue(undefined);
});
describe('cadastro e envio de acesso pela gestão', () => {
  it('gera senha individual, salva somente hash e envia credenciais ao e-mail cadastrado', async () => {
    await expect(createEmployee(form())).rejects.toThrow('result=created');
    const message = mocks.send.mock.calls[0][0];
    expect(message.to).toBe('corretor@example.com');
    expect(message.initialPassword.length).toBeGreaterThanOrEqual(24);
    expect(message.loginUrl).toContain('/login');
    const saved = mocks.create.mock.calls[0][0].data;
    expect(saved.passwordHash).toMatch(/^\$2/);
    expect(saved.passwordHash).not.toBe(message.initialPassword);
    expect(saved.password).toBeUndefined();
    expect(JSON.stringify(mocks.audit.mock.calls)).not.toContain(message.initialPassword);
  });
  it('mantém o cadastro e informa falha de envio sem criar outra conta', async () => {
    mocks.send.mockRejectedValue(new Error('provider unavailable'));
    await expect(createEmployee(form())).rejects.toThrow('result=created-email-failed');
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
  it('não cria conta sem serviço de e-mail configurado', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    await expect(createEmployee(form())).rejects.toThrow('result=email-unavailable');
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('envia recuperação somente ao endereço do cadastro e respeita o papel da gestão', async () => {
    mocks.target.mockResolvedValue({
      email: 'cadastrado@example.com',
      role: 'CONSULTANT',
      isActive: true,
    });
    mocks.reset.mockResolvedValue('opaque-token');
    mocks.sendReset.mockResolvedValue(undefined);
    const data = new FormData();
    data.set('userId', 'cnewuser000000000000000001');
    data.set('email', 'other@example.com');
    await expect(sendEmployeeAccessLink(data)).rejects.toThrow('result=access-link-sent');
    expect(mocks.sendReset).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'cadastrado@example.com' }),
    );
    mocks.target.mockResolvedValue({ email: 'admin@example.com', role: 'ADMIN', isActive: true });
    await expect(sendEmployeeAccessLink(data)).rejects.toThrow('result=invalid');
    expect(mocks.sendReset).toHaveBeenCalledTimes(1);
  });
});

afterEach(() => vi.unstubAllEnvs());
