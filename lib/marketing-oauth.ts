import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';

import { alphaPath } from '@/lib/public-path';

export type MarketingProvider = 'google_ads' | 'meta';

export function isMarketingProvider(value: string): value is MarketingProvider {
  return value === 'google_ads' || value === 'meta';
}

export function oauthConfig(provider: MarketingProvider) {
  const clientId =
    provider === 'google_ads' ? process.env.GOOGLE_OAUTH_CLIENT_ID : process.env.META_APP_ID;
  const clientSecret =
    provider === 'google_ads'
      ? process.env.GOOGLE_OAUTH_CLIENT_SECRET
      : process.env.META_LEAD_APP_SECRET;
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  const key = process.env.MARKETING_TOKEN_ENCRYPTION_KEY;
  if (!clientId || !clientSecret || !origin || !key || /^replace-/i.test(key)) return null;
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return null;
  }
  if (
    parsedOrigin.origin !== parsedOrigin.href.replace(/\/$/, '') ||
    (process.env.NODE_ENV === 'production' && parsedOrigin.protocol !== 'https:') ||
    !encryptionKey()
  )
    return null;
  return {
    clientId,
    clientSecret,
    redirectUri: `${parsedOrigin.origin}${alphaPath(`/api/admin/integrations/${provider}/callback`)}`,
  };
}

function encryptionKey() {
  const raw = process.env.MARKETING_TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;
  const decoded = Buffer.from(raw, 'base64url');
  return decoded.length === 32 ? decoded : null;
}

export function encryptMarketingToken(value: string) {
  const key = encryptionKey();
  if (!key) throw new Error('Chave de criptografia das integrações ausente.');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
}

export function decryptMarketingToken(value: string) {
  const key = encryptionKey();
  if (!key) throw new Error('Chave de criptografia das integrações ausente.');
  const [version, iv, tag, ciphertext] = value.split('.');
  if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('Token inválido.');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function hashOAuthState(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function personalGoogleWebhookKey(connectionId: string) {
  const key = encryptionKey();
  if (!key) throw new Error('Chave de criptografia das integrações ausente.');
  return createHmac('sha256', key)
    .update(`alpha:google-ads:webhook:${connectionId}`)
    .digest('base64url');
}

export function providerAuthorizationUrl(provider: MarketingProvider, state: string) {
  const config = oauthConfig(provider);
  if (!config) return null;
  if (provider === 'google_ads') {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: 'openid email https://www.googleapis.com/auth/adwords',
      state,
    }).toString();
    return url;
  }
  const version = process.env.META_GRAPH_VERSION || 'v24.0';
  if (!/^v\d+\.\d+$/.test(version)) return null;
  const url = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'pages_show_list,pages_manage_metadata,leads_retrieval,ads_read',
    state,
  }).toString();
  return url;
}

export function integrationsReturnUrl(result: string) {
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').origin;
  const url = new URL(`${origin}${alphaPath('/admin/minha-conta')}`);
  url.searchParams.set('integracao', result);
  return url;
}
