import 'server-only';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@prisma/client';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

const cookieName = process.env.SESSION_COOKIE_NAME ?? 'alpha_session';
const ttlDays = Number(process.env.SESSION_TTL_DAYS ?? 14);
const maxAttempts = Number(process.env.LOGIN_MAX_ATTEMPTS ?? 8);
const maxIpAttempts = Number(process.env.LOGIN_MAX_IP_ATTEMPTS ?? 30);
const attemptWindowMinutes = Number(process.env.LOGIN_ATTEMPT_WINDOW_MINUTES ?? 15);

function hash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function requestFingerprint() {
  const h = await headers();
  const trustProxyHeaders = process.env.TRUST_PROXY_HEADERS === 'true';
  const forwarded = trustProxyHeaders ? h.get('x-forwarded-for')?.split(',')[0]?.trim() : null;
  const realIp = trustProxyHeaders ? h.get('x-real-ip') : null;
  const ip = forwarded ?? realIp ?? 'unavailable';
  return { ipHash: hash(ip), userAgent: h.get('user-agent')?.slice(0, 500) ?? null };
}

export async function login(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const emailHash = hash(email);
  const { ipHash, userAgent } = await requestFingerprint();
  const windowStart = new Date(Date.now() - attemptWindowMinutes * 60_000);
  const [failedForAccount, failedForIp] = await Promise.all([
    db.loginAttempt.count({
      where: { emailHash, successful: false, createdAt: { gte: windowStart } },
    }),
    db.loginAttempt.count({
      where: { ipHash, successful: false, createdAt: { gte: windowStart } },
    }),
  ]);
  if (failedForAccount >= maxAttempts || failedForIp >= maxIpAttempts) {
    return { ok: false as const, reason: 'RATE_LIMITED' as const };
  }

  const user = await db.user.findUnique({ where: { email } });
  const valid = Boolean(user?.isActive && (await bcrypt.compare(password, user.passwordHash)));
  await db.loginAttempt.create({ data: { emailHash, ipHash, successful: valid } });
  if (!valid || !user) return { ok: false as const, reason: 'INVALID_CREDENTIALS' as const };

  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { tokenHash: hash(token), userId: user.id, expiresAt, ipHash, userAgent },
  });
  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
  return { ok: true as const, user };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hash(token) } });
  jar.delete(cookieName);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date() || !session.user.isActive) {
    if (session) await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    jar.delete(cookieName);
    return null;
  }
  if (Date.now() - session.lastSeenAt.getTime() > 15 * 60_000) {
    await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect('/admin/sem-acesso');
  return user;
}

export async function requirePermission(permission: string) {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) redirect('/admin/sem-acesso');
  return user;
}

export async function requireApiUser() {
  return getCurrentUser();
}

export async function requireApiPermission(permission: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, status: 401, error: 'Não autenticado' };
  if (!hasPermission(user.role, permission))
    return { ok: false as const, status: 403, error: 'Sem permissão' };
  return { ok: true as const, user };
}

export async function createPasswordReset(emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return null;
  await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  const token = crypto.randomBytes(32).toString('base64url');
  await db.passwordResetToken.create({
    data: {
      tokenHash: hash(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 60_000),
    },
  });
  return token;
}

export async function resetPassword(token: string, password: string) {
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) return false;
  const passwordHash = await bcrypt.hash(password, 12);
  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: record.userId } }),
  ]);
  return true;
}
