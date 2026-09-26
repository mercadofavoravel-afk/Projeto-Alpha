import { alphaPath } from '@/lib/public-path';

export function createPasswordResetUrl(appUrl: string, token: string) {
  const url = new URL(alphaPath('/redefinir-senha'), appUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

export function isPasswordResetEmailConfigured() {
  return Boolean(process.env.APP_URL && process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
