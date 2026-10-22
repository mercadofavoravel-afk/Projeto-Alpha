import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { sendEmployeeAccessEmail } from './email';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe('e-mail de acesso inicial', () => {
  it('envia link, login e senha individuais e só confirma resposta aceita', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-only');
    vi.stubEnv('EMAIL_FROM', 'Alpha <test@example.com>');
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetch);
    const data = {
      to: 'broker@example.com',
      name: 'Corretor',
      initialPassword: 'individual-password',
      loginUrl: 'https://example.com/alpha/login',
      idempotencyKey: 'employee-access/user',
    };
    await sendEmployeeAccessEmail(data);
    const request = fetch.mock.calls[0][1];
    const body = JSON.parse(request.body);
    expect(body.to).toEqual([data.to]);
    expect(body.text).toContain(data.initialPassword);
    expect(body.text).toContain(data.loginUrl);
    expect(request.headers['Idempotency-Key']).toBe(data.idempotencyKey);
    fetch.mockResolvedValue({ ok: false, status: 503 });
    await expect(sendEmployeeAccessEmail(data)).rejects.toThrow('503');
  });
});
