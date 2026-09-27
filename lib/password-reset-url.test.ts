import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPasswordResetUrl, isPasswordResetEmailConfigured } from './password-reset-url';

afterEach(() => vi.unstubAllEnvs());

describe('password recovery', () => {
  it('uses the public Alpha path even when APP_URL already contains /alpha', () => {
    vi.stubEnv('NEXT_PUBLIC_ALPHA_BASE_PATH', '/alpha');
    vi.stubEnv('APP_URL', 'https://imoveisdealtopadraorio.com.br/alpha');
    const link = createPasswordResetUrl('token-1');
    expect(link).toBe('https://imoveisdealtopadraorio.com.br/alpha/redefinir-senha?token=token-1');
  });

  it('uses the existing public site URL when APP_URL is not configured', () => {
    vi.stubEnv('NEXT_PUBLIC_ALPHA_BASE_PATH', '/alpha');
    vi.stubEnv('APP_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://imoveisdealtopadraorio.com.br');
    expect(createPasswordResetUrl('token-2')).toBe(
      'https://imoveisdealtopadraorio.com.br/alpha/redefinir-senha?token=token-2',
    );
  });

  it('checks recovery service configuration without inspecting accounts', () => {
    vi.stubEnv('APP_URL', '');
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('EMAIL_FROM', 'contato@imoveisdealtopadraorio.com.br');
    expect(isPasswordResetEmailConfigured()).toBe(false);
    vi.stubEnv('RESEND_API_KEY', 'configured');
    expect(isPasswordResetEmailConfigured()).toBe(true);
  });
});
