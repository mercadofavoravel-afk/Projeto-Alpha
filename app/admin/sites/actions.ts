'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { encryptMarketingToken } from '@/lib/marketing-oauth';
import { normalizeWordPressSite, verifyWordPressEditor } from '@/lib/wordpress-site';

function done(result: string): never {
  revalidatePath('/admin/sites');
  redirect(`/admin/sites?result=${result}`);
}

export async function connectWordPressSite(formData: FormData) {
  const user = await requirePermission('sites:manage');
  const url = formData.get('siteUrl');
  const username = formData.get('username');
  const appPassword = formData.get('appPassword');
  if (
    typeof url !== 'string' ||
    typeof username !== 'string' ||
    typeof appPassword !== 'string' ||
    username.trim().length < 2 ||
    username.length > 100 ||
    /[:\r\n]/u.test(username) ||
    appPassword.replace(/\s/g, '').length < 16 ||
    appPassword.length > 128
  )
    done('invalid');
  const siteUrl = normalizeWordPressSite(url);
  if (!siteUrl) done('invalid');
  const existing = await db.customerSite.findUnique({
    where: { siteUrl },
    select: { id: true, ownerId: true },
  });
  if (existing && existing.ownerId !== user.id) done('in-use');
  if (!existing && (await db.customerSite.count({ where: { ownerId: user.id } })) >= 10)
    done('limit');
  const verified = await verifyWordPressEditor(siteUrl, username.trim(), appPassword);
  if (!verified) done('verification');
  let encrypted: string;
  try {
    encrypted = encryptMarketingToken(appPassword);
  } catch {
    done('configuration');
  }
  try {
    await db.$transaction(async (tx) => {
      const site = existing
        ? await tx.customerSite.update({
            where: { id: existing.id, ownerId: user.id },
            data: {
              wpUsername: username.trim(),
              applicationPasswordEncrypted: encrypted,
              wpUserId: verified.id,
              wpDisplayName: verified.name,
              verifiedAt: new Date(),
            },
          })
        : await tx.customerSite.create({
            data: {
              ownerId: user.id,
              siteUrl,
              wpUsername: username.trim(),
              applicationPasswordEncrypted: encrypted,
              wpUserId: verified.id,
              wpDisplayName: verified.name,
              verifiedAt: new Date(),
            },
          });
      await tx.auditLog.create({
        data: {
          action: existing ? 'customer_site.reconnected' : 'customer_site.connected',
          entityType: 'CustomerSite',
          entityId: site.id,
          userId: user.id,
          metadata: { siteUrl },
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      done('in-use');
    throw error;
  }
  done('connected');
}

export async function disconnectWordPressSite(formData: FormData) {
  const user = await requirePermission('sites:manage');
  const id = formData.get('siteId');
  if (typeof id !== 'string' || !/^[a-z0-9]{20,40}$/i.test(id)) done('invalid');
  await db.$transaction(async (tx) => {
    const removed = await tx.customerSite.deleteMany({ where: { id, ownerId: user.id } });
    if (removed.count)
      await tx.auditLog.create({
        data: {
          action: 'customer_site.disconnected',
          entityType: 'CustomerSite',
          entityId: id,
          userId: user.id,
        },
      });
  });
  done('disconnected');
}
