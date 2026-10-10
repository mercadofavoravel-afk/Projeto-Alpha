'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  encryptMarketingToken,
  hashOAuthState,
  isMarketingProvider,
  personalGoogleWebhookKey,
} from '@/lib/marketing-oauth';
import { selectableMarketingAccounts, unsubscribeMetaPage } from '@/lib/marketing-accounts';
import { Prisma } from '@prisma/client';
import { isCommercialCustomer } from '@/lib/commercial-subscription';

export async function changeOwnPassword(formData: FormData) {
  const user = await requireUser();
  const current = formData.get('currentPassword');
  const next = formData.get('newPassword');
  const confirmation = formData.get('confirmPassword');
  if (
    typeof current !== 'string' ||
    typeof next !== 'string' ||
    typeof confirmation !== 'string' ||
    next !== confirmation ||
    next.length < 12 ||
    next.length > 128
  ) {
    redirect('/admin/minha-conta?result=invalid');
  }
  if (!(await bcrypt.compare(current, user.passwordHash))) {
    redirect('/admin/minha-conta?result=current');
  }
  const passwordHash = await bcrypt.hash(next, 12);
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordChangedAt: new Date() },
    }),
    db.session.deleteMany({ where: { userId: user.id } }),
    db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
  ]);
  redirect('/login');
}

export async function disconnectMarketingAccount(formData: FormData) {
  const user = await requireUser();
  const provider = formData.get('provider');
  if (typeof provider !== 'string' || !isMarketingProvider(provider)) {
    redirect('/admin/minha-conta?integracao=invalido');
  }
  const connection = await db.marketingConnection.findUnique({
    where: { userId_provider: { userId: user.id, provider } },
    select: { selectedAccountId: true, selectedTokenEncrypted: true },
  });
  await db.$transaction([
    db.marketingConnection.deleteMany({ where: { userId: user.id, provider } }),
    db.marketingAuthState.deleteMany({ where: { userId: user.id, provider } }),
    db.auditLog.create({
      data: {
        action: 'marketing.connection.disconnected',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
        metadata: { provider },
      },
    }),
  ]);
  if (provider === 'meta' && connection?.selectedAccountId)
    await unsubscribeMetaPage(connection.selectedAccountId, connection.selectedTokenEncrypted);
  redirect('/admin/minha-conta?integracao=desconectado');
}

export async function selectMarketingAccount(formData: FormData) {
  const user = await requireUser();
  if (isCommercialCustomer(user)) redirect('/admin/minha-conta?integracao=crm-pendente');
  const provider = formData.get('provider');
  const accountId = formData.get('accountId');
  if (
    typeof provider !== 'string' ||
    !isMarketingProvider(provider) ||
    typeof accountId !== 'string' ||
    !/^\d{1,40}$/.test(accountId)
  )
    redirect('/admin/minha-conta?integracao=invalido');
  const connection = await db.marketingConnection.findUnique({
    where: { userId_provider: { userId: user.id, provider } },
  });
  if (!connection) redirect('/admin/minha-conta?integracao=expirado');
  let accounts;
  try {
    accounts = await selectableMarketingAccounts(connection);
  } catch {
    accounts = null;
  }
  const selected = accounts?.find((account) => account.id === accountId);
  if (!selected) redirect('/admin/minha-conta?integracao=conta-inacessivel');
  const alreadySelected = await db.marketingConnection.findFirst({
    where: { provider, selectedAccountId: selected.id, userId: { not: user.id } },
    select: { id: true },
  });
  if (alreadySelected) redirect('/admin/minha-conta?integracao=conta-em-uso');
  if (provider === 'meta') {
    const version = process.env.META_GRAPH_VERSION || 'v24.0';
    if (
      !selected.token ||
      !process.env.META_LEAD_VERIFY_TOKEN ||
      !process.env.META_LEAD_APP_SECRET ||
      !/^v\d+\.\d+$/.test(version)
    )
      redirect('/admin/minha-conta?integracao=configuracao');
    // Subscribing the selected Page is needed in addition to authorizing the user's profile.
    const subscribe = await fetch(
      `https://graph.facebook.com/${version}/${selected.id}/subscribed_apps`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${selected.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ subscribed_fields: 'leadgen' }),
        signal: AbortSignal.timeout(10_000),
        cache: 'no-store',
      },
    ).catch(() => null);
    const subscribed =
      subscribe?.ok && (await subscribe.json().catch(() => null))?.success === true;
    if (!subscribed) redirect('/admin/minha-conta?integracao=assinatura');
  }
  try {
    await db.marketingConnection.update({
      where: { id: connection.id },
      data: {
        selectedAccountId: selected.id,
        selectedAccountName: selected.name,
        selectedTokenEncrypted: selected.token ? encryptMarketingToken(selected.token) : null,
        webhookKeyHash:
          provider === 'google_ads'
            ? hashOAuthState(personalGoogleWebhookKey(connection.id))
            : null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      redirect('/admin/minha-conta?integracao=conta-em-uso');
    throw error;
  }
  await db.auditLog.create({
    data: {
      action: 'marketing.account.selected',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      metadata: { provider, accountId: selected.id },
    },
  });
  if (
    provider === 'meta' &&
    connection.selectedAccountId &&
    connection.selectedAccountId !== selected.id
  )
    await unsubscribeMetaPage(connection.selectedAccountId, connection.selectedTokenEncrypted);
  redirect('/admin/minha-conta?integracao=conta-selecionada');
}
