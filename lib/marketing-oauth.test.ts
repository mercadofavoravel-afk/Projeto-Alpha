import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  decryptMarketingToken,
  encryptMarketingToken,
  hashOAuthState,
  oauthConfig,
  personalGoogleWebhookKey,
  providerAuthorizationUrl,
} from './marketing-oauth';

describe('individual marketing connections', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('encrypts credentials with authenticated encryption and rejects tampering', () => {
    vi.stubEnv('MARKETING_TOKEN_ENCRYPTION_KEY', Buffer.alloc(32, 8).toString('base64url'));
    const encrypted = encryptMarketingToken('provider-token');
    expect(encrypted).not.toContain('provider-token');
    expect(decryptMarketingToken(encrypted)).toBe('provider-token');
    const parts = encrypted.split('.');
    expect(() => decryptMarketingToken(`${parts[0]}.${parts[1]}.${parts[2]}.AAAA`)).toThrow();
    expect(personalGoogleWebhookKey('user-1')).not.toBe(personalGoogleWebhookKey('user-2'));
    expect(hashOAuthState('state')).not.toBe('state');
  });

  it('builds only canonical callbacks and refuses absent application credentials', () => {
    vi.stubEnv('MARKETING_TOKEN_ENCRYPTION_KEY', Buffer.alloc(32, 8).toString('base64url'));
    vi.stubEnv('GOOGLE_OAUTH_CLIENT_ID', 'google-client');
    vi.stubEnv('GOOGLE_OAUTH_CLIENT_SECRET', 'google-secret');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://imoveisdealtopadraorio.com.br');
    vi.stubEnv('NEXT_PUBLIC_ALPHA_BASE_PATH', '/alpha');
    expect(oauthConfig('google_ads')?.redirectUri).toBe(
      'https://imoveisdealtopadraorio.com.br/alpha/api/admin/integrations/google_ads/callback',
    );
    const url = providerAuthorizationUrl('google_ads', 'unique-state');
    expect(url?.origin).toBe('https://accounts.google.com');
    expect(url?.searchParams.get('state')).toBe('unique-state');
    expect(url?.searchParams.get('access_type')).toBe('offline');
    vi.stubEnv('GOOGLE_OAUTH_CLIENT_SECRET', '');
    expect(providerAuthorizationUrl('google_ads', 'state')).toBeNull();
  });
});
