import 'server-only';

import { db } from '@/lib/db';
import { sendNewLeadEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/lib/site-config';

const pendingAction = 'lead.email_notification.pending';
const sentAction = 'lead.email_notification.sent';

/** The matrix inbox is fixed here; licensed organizations need their own scoped delivery. */
export function leadNotificationPending(leadId: string) {
  return {
    action: pendingAction,
    entityType: 'Lead',
    entityId: leadId,
    metadata: { destination: SITE_CONFIG.email },
  };
}

export async function deliverLeadNotification(leadId: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return false;
  try {
    return await db.$transaction(
      async (transaction) => {
        // The same lead can be processed by its request and the daily recovery job.
        const lock = `lead-email:${leadId}`;
        // PostgreSQL returns void here; execute without decoding a result row in Prisma.
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lock}))`;
        const pending = await transaction.auditLog.findFirst({
          where: { action: pendingAction, entityType: 'Lead', entityId: leadId },
          select: { id: true },
        });
        if (!pending) return false;
        const sent = await transaction.auditLog.findFirst({
          where: { action: sentAction, entityType: 'Lead', entityId: leadId },
          select: { id: true },
        });
        if (sent) return true;

        const lead = await transaction.lead.findUnique({
          where: { id: leadId },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            neighborhood: true,
            articleSlug: true,
            source: true,
            consent: true,
          },
        });
        if (!lead) return false;
        await sendNewLeadEmail({
          to: SITE_CONFIG.email,
          lead,
          idempotencyKey: `alpha-matrix-lead-${leadId}`,
        });
        await transaction.auditLog.create({
          data: {
            action: sentAction,
            entityType: 'Lead',
            entityId: leadId,
            metadata: { destination: SITE_CONFIG.email },
          },
        });
        return true;
      },
      { timeout: 15_000 },
    );
  } catch (error) {
    // An email failure must never discard a lead already committed to the CRM.
    console.error('Falha na notificação do lead matriz', { leadId, error });
    return false;
  }
}

export async function retryPendingLeadNotifications(limit = 10) {
  const pending = await db.$queryRaw<Array<{ entityId: string }>>`
    SELECT DISTINCT p."entityId" AS "entityId"
    FROM "AuditLog" p
    WHERE p."action" = ${pendingAction} AND p."entityType" = 'Lead'
      AND p."entityId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "AuditLog" s
        WHERE s."action" = ${sentAction} AND s."entityType" = 'Lead'
          AND s."entityId" = p."entityId"
      )
    ORDER BY p."entityId"
    LIMIT ${limit}
  `;
  const ids = pending.map((item) => item.entityId);
  let failed = 0;
  for (let start = 0; start < ids.length; start += 5) {
    const results = await Promise.all(ids.slice(start, start + 5).map(deliverLeadNotification));
    failed += results.filter((sent) => !sent).length;
  }
  return { attempted: ids.length, failed };
}
