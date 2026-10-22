'use server';

import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { Prisma, UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createPasswordReset, requireRole, revokePasswordReset } from '@/lib/auth';
import { sendEmployeeAccessEmail, sendPasswordResetEmail } from '@/lib/email';
import { createPasswordResetUrl } from '@/lib/password-reset-url';
import { alphaPath } from '@/lib/public-path';
import { getSiteUrl } from '@/lib/seo/canonical';
import { db } from '@/lib/db';
import { canManageEmployeeRole, employeeRoles } from '@/lib/team-roles';
import { leadRoutingSettingsSchema } from '@/lib/lead-routing-settings';

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
  role: z.enum(employeeRoles),
  password: z.union([z.string().min(12).max(128), z.literal('')]).optional(),
  acceptsLeads: z.boolean(),
  leadCapacity: z.number().int().min(1).max(500),
  serviceRegions: z.array(z.string().trim().min(2).max(80)).max(30),
  managerId: z.string().cuid().nullable(),
});

function parseRegions(formData: FormData) {
  return leadRoutingSettingsSchema.safeParse({
    scope: formData.get('routingScope'),
    regions: String(formData.get('serviceRegions') ?? ''),
  });
}

function parseManagerId(value: FormDataEntryValue | null) {
  return String(value ?? '').trim() || null;
}

async function validManager(id: string | null) {
  if (!id) return true;
  return Boolean(
    await db.user.findFirst({
      where: { id, role: 'MANAGER', isActive: true },
      select: { id: true },
    }),
  );
}

function done(result: string): never {
  revalidatePath('/admin/usuarios');
  redirect(`/admin/usuarios?result=${result}`);
}

export async function createEmployee(formData: FormData) {
  const actor = await requireRole(['ADMIN', 'DIRECTOR']);
  const routing = parseRegions(formData);
  if (!routing.success) done('routing');
  const parsed = createSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    password: String(formData.get('password') || ''),
    acceptsLeads: formData.get('acceptsLeads') === 'true',
    leadCapacity: Number(formData.get('leadCapacity') || 30),
    serviceRegions: routing.data,
    managerId: parseManagerId(formData.get('managerId')),
  });
  if (!parsed.success) done('invalid');

  const { name, email, role, password, acceptsLeads, leadCapacity, serviceRegions, managerId } =
    parsed.data;
  if (!canManageEmployeeRole(actor.role, role)) done('invalid');
  if (role === 'CONSULTANT' && !(await validManager(managerId))) done('invalid');
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) done('email-unavailable');
  const initialPassword = password || randomBytes(24).toString('base64url');
  const passwordHash = await bcrypt.hash(initialPassword, 12);
  let createdId: string;

  try {
    createdId = await db.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          name,
          email,
          role,
          passwordHash,
          acceptsLeads,
          leadCapacity,
          serviceRegions,
          managerId: role === 'CONSULTANT' ? managerId : null,
        },
      });
      await transaction.auditLog.create({
        data: {
          action: 'user.created',
          entityType: 'User',
          entityId: user.id,
          userId: actor.id,
          metadata: { role },
        },
      });
      return user.id;
    });
  } catch (cause) {
    if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2002')
      done('duplicate');
    throw cause;
  }
  let emailAccepted = false;
  try {
    await sendEmployeeAccessEmail({
      to: email,
      name,
      initialPassword,
      loginUrl: new URL(alphaPath('/login'), getSiteUrl()).toString(),
      idempotencyKey: `employee-access/${createdId}`,
    });
    emailAccepted = true;
  } catch {
    /* Account persists; the management screen offers a recovery link. */
  }
  await db.auditLog
    .create({
      data: {
        action: emailAccepted ? 'user.access_email.accepted' : 'user.access_email.failed',
        entityType: 'User',
        entityId: createdId,
        userId: actor.id,
        metadata: { type: 'initial_access' },
      },
    })
    .catch(() => undefined);
  done(emailAccepted ? 'created' : 'created-email-failed');
}

export async function updateEmployee(formData: FormData) {
  const actor = await requireRole(['ADMIN', 'DIRECTOR']);
  const id = formData.get('userId');
  const role = formData.get('role');
  const active = formData.get('isActive') === 'true';
  const acceptsLeads = formData.get('acceptsLeads') === 'true';
  const leadCapacity = Number(formData.get('leadCapacity') || 30);
  const routing = parseRegions(formData);
  if (!routing.success) done('routing');
  const serviceRegions = routing.data;
  const managerId = parseManagerId(formData.get('managerId'));
  if (
    typeof id !== 'string' ||
    typeof role !== 'string' ||
    !employeeRoles.includes(role as (typeof employeeRoles)[number])
  )
    done('invalid');
  if (id === actor.id) done('self');
  if (!canManageEmployeeRole(actor.role, role as UserRole)) done('invalid');

  const target = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!target || !canManageEmployeeRole(actor.role, target.role)) done('invalid');
  if (managerId && !z.string().cuid().safeParse(managerId).success) done('invalid');
  if (managerId === id) done('invalid');
  if (role === 'CONSULTANT' && !(await validManager(managerId))) done('invalid');

  await db.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id },
      data: {
        role: role as UserRole,
        isActive: active,
        acceptsLeads:
          active && acceptsLeads && ['DIRECTOR', 'MANAGER', 'CONSULTANT'].includes(role),
        leadCapacity:
          Number.isInteger(leadCapacity) && leadCapacity > 0 && leadCapacity <= 500
            ? leadCapacity
            : 30,
        serviceRegions,
        managerId: role === 'CONSULTANT' ? managerId : null,
      },
    });
    if (target.role === 'MANAGER' && (!active || role !== 'MANAGER')) {
      await transaction.user.updateMany({
        where: { managerId: id },
        data: { managerId: null },
      });
    }
    if (!active || target.role !== role) {
      await transaction.session.deleteMany({ where: { userId: id } });
    }
    if (!active || !['DIRECTOR', 'MANAGER', 'CONSULTANT'].includes(role)) {
      await transaction.lead.updateMany({
        where: { assignedToId: id },
        data: { assignedToId: null },
      });
    }
    await transaction.auditLog.create({
      data: {
        action: 'user.updated',
        entityType: 'User',
        entityId: id,
        userId: actor.id,
        metadata: { role, active, acceptsLeads, leadCapacity, serviceRegions, managerId },
      },
    });
  });
  done('updated');
}

export async function sendEmployeeAccessLink(formData: FormData) {
  const actor = await requireRole(['ADMIN', 'DIRECTOR']);
  const id = String(formData.get('userId') || '');
  if (!z.string().cuid().safeParse(id).success) done('invalid');
  const target = await db.user.findUnique({
    where: { id },
    select: { role: true, email: true, isActive: true },
  });
  if (!target || !target.isActive || !canManageEmployeeRole(actor.role, target.role))
    done('invalid');
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) done('email-unavailable');
  const token = await createPasswordReset(target.email);
  if (!token) done('email-recent');
  let emailAccepted = false;
  try {
    await sendPasswordResetEmail({ to: target.email, resetUrl: createPasswordResetUrl(token) });
    emailAccepted = true;
  } catch {
    await revokePasswordReset(token);
  }
  await db.auditLog
    .create({
      data: {
        action: emailAccepted ? 'user.access_link.accepted' : 'user.access_link.failed',
        entityType: 'User',
        entityId: id,
        userId: actor.id,
        metadata: { type: 'access_recovery' },
      },
    })
    .catch(() => undefined);
  done(emailAccepted ? 'access-link-sent' : 'access-link-failed');
}
