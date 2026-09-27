import { alphaPath } from '@/lib/public-path';
import { getSiteUrl } from '@/lib/seo/canonical';

export function createPasswordResetUrl(token: string) {
  const url = new URL(alphaPath('/redefinir-senha'), process.env.APP_URL || getSiteUrl());
  url.searchParams.set('token', token);
  return url.toString();
}

export function isPasswordResetEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
