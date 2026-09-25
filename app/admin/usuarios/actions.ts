'use server';

import bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { canManageEmployeeRole, employeeRoles } from '@/lib/team-roles';

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
  role: z.enum(employeeRoles),
  password: z.string().min(12).max(128),
});

function done(result: string): never {
  revalidatePath('/admin/usuarios');
  redirect(`/admin/usuarios?result=${result}`);
}

export async function createEmployee(formData: FormData) {
  const actor = await requireRole(['ADMIN', 'DIRECTOR']);
  const parsed = createSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    password: formData.get('password'),
  });
  if (!parsed.success) done('invalid');

  const { name, email, role, password } = parsed.data;
  if (!canManageEmployeeRole(actor.role, role)) done('invalid');
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await db.$transaction(async (transaction) => {
      const user = await transaction.user.create({ data: { name, email, role, passwordHash } });
      await transaction.auditLog.create({
        data: {
          action: 'user.created',
          entityType: 'User',
          entityId: user.id,
          userId: actor.id,
          metadata: { role },
        },
      });
    });
  } catch (cause) {
    if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2002')
      done('duplicate');
    throw cause;
  }
  done('created');
}

export async function updateEmployee(formData: FormData) {
  const actor = await requireRole(['ADMIN', 'DIRECTOR']);
  const id = formData.get('userId');
  const role = formData.get('role');
  const active = formData.get('isActive') === 'true';
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

  await db.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id },
      data: { role: role as UserRole, isActive: active },
    });
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
        metadata: { role, active },
      },
    });
  });
  done('updated');
}
