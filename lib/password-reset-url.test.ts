import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPasswordResetUrl, isPasswordResetEmailConfigured } from './password-reset-url';

afterEach(() => vi.unstubAllEnvs());

describe('password recovery', () => {
  it('uses the public Alpha path even when APP_URL already contains /alpha', () => {
    vi.stubEnv('NEXT_PUBLIC_ALPHA_BASE_PATH', '/alpha');
    const link = createPasswordResetUrl('https://imoveisdealtopadraorio.com.br/alpha', 'token-1');
    expect(link).toBe('https://imoveisdealtopadraorio.com.br/alpha/redefinir-senha?token=token-1');
  });

  it('uses the same public path when APP_URL contains only the origin', () => {
    vi.stubEnv('NEXT_PUBLIC_ALPHA_BASE_PATH', '/alpha');
    expect(createPasswordResetUrl('https://imoveisdealtopadraorio.com.br', 'token-2')).toBe(
      'https://imoveisdealtopadraorio.com.br/alpha/redefinir-senha?token=token-2',
    );
  });

  it('checks recovery service configuration without inspecting accounts', () => {
    vi.stubEnv('APP_URL', 'https://imoveisdealtopadraorio.com.br/alpha');
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('EMAIL_FROM', 'contato@imoveisdealtopadraorio.com.br');
    expect(isPasswordResetEmailConfigured()).toBe(false);
    vi.stubEnv('RESEND_API_KEY', 'configured');
    expect(isPasswordResetEmailConfigured()).toBe(true);
  });
});
