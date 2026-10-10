import { NextResponse } from 'next/server';

import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  encryptMarketingToken,
  hashOAuthState,
  integrationsReturnUrl,
  isMarketingProvider,
  oauthConfig,
} from '@/lib/marketing-oauth';

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

async function exchangeCode(
  provider: 'google_ads' | 'meta',
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
) {
  if (provider === 'google_ads') {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()) as TokenResponse;
  }
  const version = process.env.META_GRAPH_VERSION || 'v24.0';
  if (!/^v\d+\.\d+$/.test(version)) return null;
  const url = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  url.search = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000), cache: 'no-store' });
  if (!response.ok) return null;
  const shortLived = (await response.json()) as TokenResponse;
  if (!shortLived.access_token) return null;
  const extended = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  extended.search = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: shortLived.access_token,
  }).toString();
  const longResponse = await fetch(extended, {
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  });
  if (!longResponse.ok) return null;
  return (await longResponse.json()) as TokenResponse;
}

async function providerIdentity(provider: 'google_ads' | 'meta', accessToken: string) {
  const version = process.env.META_GRAPH_VERSION || 'v24.0';
  const url =
    provider === 'google_ads'
      ? 'https://openidconnect.googleapis.com/v1/userinfo'
      : `https://graph.facebook.com/${version}/me?fields=id,name`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const identity = (await response.json()) as {
    sub?: string;
    id?: string;
    email?: string;
    name?: string;
  };
  const id = provider === 'google_ads' ? identity.sub : identity.id;
  return id ? { id, email: identity.email || null, name: identity.name || null } : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isMarketingProvider(provider))
    return NextResponse.redirect(integrationsReturnUrl('invalido'));
  const auth = await requireApiPermission('admin:access');
  if (!auth.ok) return NextResponse.redirect(integrationsReturnUrl('sessao'));
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  if (!state || state.length > 200 || !code || code.length > 2048 || url.searchParams.has('error'))
    return NextResponse.redirect(integrationsReturnUrl('cancelado'));
  const claimed = await db.marketingAuthState.deleteMany({
    where: {
      stateHash: hashOAuthState(state),
      userId: auth.user.id,
      provider,
      expiresAt: { gt: new Date() },
    },
  });
  if (claimed.count !== 1) return NextResponse.redirect(integrationsReturnUrl('expirado'));
  const config = oauthConfig(provider);
  if (!config) return NextResponse.redirect(integrationsReturnUrl('configuracao'));
  try {
    const tokens = await exchangeCode(
      provider,
      code,
      config.redirectUri,
      config.clientId,
      config.clientSecret,
    );
    if (!tokens?.access_token) return NextResponse.redirect(integrationsReturnUrl('falha'));
    const identity = await providerIdentity(provider, tokens.access_token);
    if (!identity) return NextResponse.redirect(integrationsReturnUrl('falha'));
    const existing = await db.marketingConnection.findUnique({
      where: { userId_provider: { userId: auth.user.id, provider } },
      select: {
        refreshTokenEncrypted: true,
        providerUserId: true,
        selectedAccountId: true,
        selectedAccountName: true,
        selectedTokenEncrypted: true,
        webhookKeyHash: true,
      },
    });
    await db.marketingConnection.upsert({
      where: { userId_provider: { userId: auth.user.id, provider } },
      create: {
        userId: auth.user.id,
        provider,
        providerUserId: identity.id,
        displayName: identity.name,
        email: identity.email,
        accessTokenEncrypted: encryptMarketingToken(tokens.access_token),
        refreshTokenEncrypted: tokens.refresh_token
          ? encryptMarketingToken(tokens.refresh_token)
          : null,
        expiresAt:
          typeof tokens.expires_in === 'number'
            ? new Date(Date.now() + tokens.expires_in * 1000)
            : null,
        scopes: tokens.scope || null,
        selectedAccountId: null,
        selectedAccountName: null,
        selectedTokenEncrypted: null,
        webhookKeyHash: null,
      },
      update: {
        providerUserId: identity.id,
        displayName: identity.name,
        email: identity.email,
        accessTokenEncrypted: encryptMarketingToken(tokens.access_token),
        // A reconnect may not return another refresh token. Preserve the previous one only for the same identity.
        refreshTokenEncrypted: tokens.refresh_token
          ? encryptMarketingToken(tokens.refresh_token)
          : existing?.providerUserId === identity.id
            ? existing.refreshTokenEncrypted
            : null,
        expiresAt:
          typeof tokens.expires_in === 'number'
            ? new Date(Date.now() + tokens.expires_in * 1000)
            : null,
        scopes: tokens.scope || null,
        // Preserve the selected account only if this is the same external identity.
        selectedAccountId:
          existing?.providerUserId === identity.id ? existing.selectedAccountId : null,
        selectedAccountName:
          existing?.providerUserId === identity.id ? existing.selectedAccountName : null,
        selectedTokenEncrypted:
          existing?.providerUserId === identity.id ? existing.selectedTokenEncrypted : null,
        webhookKeyHash: existing?.providerUserId === identity.id ? existing.webhookKeyHash : null,
      },
    });
    await db.auditLog.create({
      data: {
        action: 'marketing.connection.authorized',
        entityType: 'User',
        entityId: auth.user.id,
        userId: auth.user.id,
        metadata: { provider },
      },
    });
    return NextResponse.redirect(integrationsReturnUrl('conectado'));
  } catch {
    return NextResponse.redirect(integrationsReturnUrl('falha'));
  }
}
