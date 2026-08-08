'use server';
import { redirect } from 'next/navigation';
import { createPasswordReset } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';

export async function requestResetAction(formData: FormData) {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const token = await createPasswordReset(email);

  if (token) {
    if (process.env.NODE_ENV !== 'production') {
      redirect(`/redefinir-senha?token=${encodeURIComponent(token)}`);
    }

    const appUrl = process.env.APP_URL;
    if (!appUrl) throw new Error('APP_URL não configurada');
    const resetUrl = new URL('/redefinir-senha', appUrl);
    resetUrl.searchParams.set('token', token);
    await sendPasswordResetEmail({ to: email, resetUrl: resetUrl.toString() });
  }

  redirect('/recuperar-senha?sent=1');
}
