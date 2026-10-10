import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

import { crmDayWindow } from '@/lib/crm-day';
import { db } from '@/lib/db';
import { sendCrmRiskDigestEmail } from '@/lib/email';
import { leadRiskQueries } from '@/lib/lead-risk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function authorized(header: string | null, secret: string | undefined) {
  if (!secret || !header) return false;
  const received = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Rotina não configurada.' }, { status: 503 });
  }
  if (!authorized(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json({ error: 'E-mail não configurado.' }, { status: 503 });
  }

  const now = new Date();
  const { today, tomorrow } = crmDayWindow(now);
  const day = today.toISOString().slice(0, 10);
  const users = await db.user.findMany({
    where: {
      isActive: true,
      billingMode: 'INTERNAL',
      role: { in: ['ADMIN', 'DIRECTOR', 'MANAGER', 'CONSULTANT'] },
    },
    select: { id: true, email: true, role: true },
    orderBy: { id: 'asc' },
    take: 26,
  });
  // A larger team needs batching before this function can promise complete delivery.
  if (users.length > 25) {
    return NextResponse.json(
      { error: 'Equipe excede o lote diário configurado.' },
      { status: 503 },
    );
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const user of users) {
    const queries = leadRiskQueries(user, now);
    const counts = Object.fromEntries(
      await Promise.all(
        Object.entries(queries).map(async ([kind, where]) => [
          kind,
          await db.lead.count({ where }),
        ]),
      ),
    );
    if (Object.values(counts).every((count) => count === 0)) {
      skipped += 1;
      continue;
    }

    try {
      const result = await db.$transaction(
        async (transaction) => {
          // Serializes duplicate invocations for this person and calendar day.
          const lock = `crm-digest:${day}:${user.id}`;
          await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lock}))`;
          const existing = await transaction.auditLog.findFirst({
            where: {
              action: 'crm.daily_digest.sent',
              entityType: 'User',
              entityId: user.id,
              createdAt: { gte: today, lt: tomorrow },
            },
            select: { id: true },
          });
          if (existing) return 'skipped';

          await sendCrmRiskDigestEmail({
            to: user.email,
            day,
            counts,
            idempotencyKey: lock,
          });
          await transaction.auditLog.create({
            data: {
              action: 'crm.daily_digest.sent',
              entityType: 'User',
              entityId: user.id,
              metadata: { day, counts },
            },
          });
          return 'sent';
        },
        { timeout: 15_000 },
      );
      if (result === 'sent') sent += 1;
      else skipped += 1;
    } catch (error) {
      failed += 1;
      console.error('Falha no resumo diário do CRM', { userId: user.id, error });
    }
  }

  return NextResponse.json(
    { sent, skipped, failed },
    { status: failed ? 503 : 200, headers: { 'Cache-Control': 'private, no-store' } },
  );
}
