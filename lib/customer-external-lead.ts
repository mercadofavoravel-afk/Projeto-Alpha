import { Prisma } from '@prisma/client';

import { assignableSubscriptionWhere } from '@/lib/commercial-subscription';
import { db } from '@/lib/db';

export type CustomerExternalLead = {
  siteId: string;
  ownerId: string;
  provider: 'GOOGLE_ADS' | 'META_LEAD_ADS';
  externalId: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  utmSource: string;
  utmCampaign?: string | null;
};

// Commercial integrations must never use the matrix Lead/LeadActivity tables.
export async function storeCustomerExternalLead(input: CustomerExternalLead) {
  const site = await db.customerSite.findFirst({
    where: {
      id: input.siteId,
      ownerId: input.ownerId,
      owner: { isActive: true, ...assignableSubscriptionWhere() },
    },
    select: { id: true },
  });
  if (!site) return false;
  const key = {
    siteId_externalProvider_externalId: {
      siteId: site.id,
      externalProvider: input.provider,
      externalId: input.externalId,
    },
  };
  if (await db.customerLead.findUnique({ where: key, select: { id: true } })) return true;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await db.$transaction(
        async (tx) => {
          const lead = await tx.customerLead.create({
            data: {
              siteId: site.id,
              name: input.name,
              phone: input.phone,
              email: input.email,
              source: input.source.slice(0, 200),
              externalProvider: input.provider,
              externalId: input.externalId,
              utmSource: input.utmSource,
              utmMedium: 'paid',
              utmCampaign: input.utmCampaign || null,
              consent: false, // Native ad forms have no distinct Alpha consent field.
            },
          });
          await tx.customerLeadActivity.create({
            data: {
              leadId: lead.id,
              type: 'TASK',
              dueAt: lead.createdAt,
              note: `Primeiro atendimento pendente: lead recebido de ${input.provider}.`,
            },
          });
          await tx.auditLog.create({
            data: {
              action: 'customer_lead.ad_received',
              entityType: 'CustomerLead',
              entityId: lead.id,
              metadata: { siteId: site.id, provider: input.provider, ownerId: input.ownerId },
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        return Boolean(await db.customerLead.findUnique({ where: key, select: { id: true } }));
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034' &&
        attempt === 0
      )
        continue;
      return false;
    }
  }
  return false;
}
