'use server';
import { redirect } from 'next/navigation';
import { resetPassword } from '@/lib/auth';
export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirmation') ?? '');
  if (password.length < 12 || password !== confirmation)
    redirect(`/redefinir-senha?token=${encodeURIComponent(token)}&error=1`);
  const ok = await resetPassword(token, password);
  if (!ok) redirect('/redefinir-senha?expired=1');
  redirect('/login?reset=1');
}
