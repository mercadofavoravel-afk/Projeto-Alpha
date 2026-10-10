import { randomBytes } from 'node:crypto';

import { NextResponse } from 'next/server';

import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  hashOAuthState,
  integrationsReturnUrl,
  isMarketingProvider,
  providerAuthorizationUrl,
} from '@/lib/marketing-oauth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const auth = await requireApiPermission('admin:access');
  if (!auth.ok) return NextResponse.redirect(integrationsReturnUrl('sessao'));
  const { provider } = await params;
  if (!isMarketingProvider(provider))
    return NextResponse.redirect(integrationsReturnUrl('invalido'));
  const state = randomBytes(32).toString('base64url');
  const url = providerAuthorizationUrl(provider, state);
  if (!url) return NextResponse.redirect(integrationsReturnUrl('configuracao'));
  await db.marketingAuthState.deleteMany({
    where: { userId: auth.user.id, provider },
  });
  await db.marketingAuthState.create({
    data: {
      userId: auth.user.id,
      provider,
      stateHash: hashOAuthState(state),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    },
  });
  return NextResponse.redirect(url, { headers: { 'Cache-Control': 'no-store' } });
}
