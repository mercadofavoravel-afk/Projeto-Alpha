'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function changeOwnPassword(formData: FormData) {
  const user = await requireUser();
  const current = formData.get('currentPassword');
  const next = formData.get('newPassword');
  if (
    typeof current !== 'string' ||
    typeof next !== 'string' ||
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
  ]);
  redirect('/login');
}
