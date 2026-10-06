import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { chooseAssignee, type DistributionCandidate } from '@/lib/lead-distribution';
import { createOrganicFollowUpActivities } from '@/lib/lead-follow-up';
import { normalizeLeadUtms } from '@/lib/utm';
import { leadSchema } from '@/lib/validation';
import { requireApiPermission } from '@/lib/auth';
import { leadAccessWhere } from '@/lib/lead-access';

export async function GET() {
  const auth = await requireApiPermission('crm:read');

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const leads = await db.lead.findMany({
    where: leadAccessWhere(auth.user),
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  return NextResponse.json({
    data: leads,
    total: leads.length,
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Dados inválidos',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const utms = normalizeLeadUtms(parsed.data);
  const { typology, ...leadData } = parsed.data;
  const message = typology
    ? `Tipologia desejada: ${typology.replace(/\s+/g, ' ')}${leadData.message ? `\n\n${leadData.message}` : ''}`
    : leadData.message;

  let lead: { id: string } | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      lead = await db.$transaction(
        async (transaction) => {
          const users = await transaction.user.findMany({
            where: {
              isActive: true,
              acceptsLeads: true,
              role: { in: ['DIRECTOR', 'MANAGER', 'CONSULTANT'] },
            },
            select: {
              id: true,
              leadCapacity: true,
              serviceRegions: true,
              lastLeadAssignedAt: true,
              _count: {
                select: { assignedLeads: { where: { status: { notIn: ['WON', 'LOST'] } } } },
              },
            },
          });
          const candidates: DistributionCandidate[] = users.map((user) => ({
            id: user.id,
            activeLeadCount: user._count.assignedLeads,
            leadCapacity: user.leadCapacity,
            serviceRegions: user.serviceRegions,
            lastLeadAssignedAt: user.lastLeadAssignedAt,
          }));
          const assignee = chooseAssignee(candidates, leadData.neighborhood);
          const createdLead = await transaction.lead.create({
            data: {
              ...leadData,
              ...utms,
              email: parsed.data.email || null,
              message,
              assignedToId: assignee?.id || null,
            },
          });

          if (createdLead.consent) {
            await transaction.leadActivity.createMany({
              data: createOrganicFollowUpActivities(createdLead, createdLead.createdAt),
            });
          }
          if (assignee) {
            await transaction.user.update({
              where: { id: assignee.id },
              data: { lastLeadAssignedAt: createdLead.createdAt },
            });
          }
          await transaction.auditLog.create({
            data: {
              action: 'lead.site_received',
              entityType: 'Lead',
              entityId: createdLead.id,
              metadata: {
                assignedToId: assignee?.id || null,
                region: createdLead.neighborhood,
                articleSlug: createdLead.articleSlug,
              },
            },
          });
          return createdLead;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      break;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034' &&
        attempt === 0
      ) {
        continue;
      }
      return NextResponse.json({ error: 'Falha temporária. Tente novamente.' }, { status: 503 });
    }
  }
  if (!lead) return NextResponse.json({ error: 'Falha temporária.' }, { status: 503 });

  return NextResponse.json(
    {
      ok: true,
      leadId: lead.id,
    },
    { status: 201 },
  );
}
