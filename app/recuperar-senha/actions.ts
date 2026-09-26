'use server';
import { redirect } from 'next/navigation';
import { createPasswordReset } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { createPasswordResetUrl, isPasswordResetEmailConfigured } from '@/lib/password-reset-url';

export async function requestResetAction(formData: FormData) {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();

  // Check service readiness before looking up the account, so the response
  // does not reveal whether this email belongs to an active user.
  if (process.env.NODE_ENV === 'production' && !isPasswordResetEmailConfigured()) {
    redirect('/recuperar-senha?error=unavailable');
  }

  const token = await createPasswordReset(email);

  if (token) {
    if (process.env.NODE_ENV !== 'production') {
      redirect(`/redefinir-senha?token=${encodeURIComponent(token)}`);
    }

    await sendPasswordResetEmail({
      to: email,
      resetUrl: createPasswordResetUrl(process.env.APP_URL!, token),
    });
  }

  redirect('/recuperar-senha?sent=1');
}
