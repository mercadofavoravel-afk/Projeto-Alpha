import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { lockRouting } from '@/lib/lead-routing';
import { processRepique } from '@/lib/lead-repique';

export async function GET() {
  const auth = await requireApiPermission('crm:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const campaigns = await db.leadRepiqueCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      items: {
        orderBy: [{ deliveredAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        take: 20,
        select: {
          id: true,
          status: true,
          assignedToId: true,
          deliveredAt: true,
          reason: true,
          lead: { select: { id: true, name: true } },
        },
      },
      _count: { select: { items: true } },
    },
  });
  const counts = await db.leadRepiqueItem.groupBy({
    by: ['campaignId', 'status'],
    where: { campaignId: { in: campaigns.map((c) => c.id) } },
    _count: { _all: true },
  });
  const brokers = await db.user.findMany({
    where: {
      isActive: true,
      acceptsLeads: true,
      role: { in: ['DIRECTOR', 'MANAGER', 'CONSULTANT'] },
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
  const tick = await db.auditLog.findFirst({
    where: { action: 'lead.repique_server_tick' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  return NextResponse.json(
    { campaigns, counts, brokers, schedulerLastSeenAt: tick?.createdAt ?? null },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

const schema = z.object({ id: z.string().cuid(), action: z.enum(['start', 'pause']) });
export async function POST(request: Request) {
  const auth = await requireApiPermission('crm:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Comando inválido.' }, { status: 400 });
  const { id, action } = parsed.data;
  const result = await db.$transaction(async (tx) => {
    await lockRouting(tx);
    const campaign = await tx.leadRepiqueCampaign.findUnique({ where: { id } });
    if (!campaign || campaign.status === 'COMPLETED') return false;
    // Starting twice must not reset the due time or accelerate the campaign.
    if (
      (action === 'start' && campaign.status === 'RUNNING') ||
      (action === 'pause' && campaign.status === 'PAUSED')
    )
      return true;
    await tx.leadRepiqueCampaign.update({
      where: { id },
      data: {
        status: action === 'start' ? 'RUNNING' : 'PAUSED',
        nextRunAt:
          action === 'start' ? new Date(Date.now() + campaign.intervalMinutes * 60_000) : null,
      },
    });
    await tx.auditLog.create({
      data: {
        action: `lead.repique_${action}`,
        entityType: 'LeadRepiqueCampaign',
        entityId: id,
        userId: auth.user.id,
      },
    });
    return true;
  });
  return NextResponse.json(result ? { ok: true } : { error: 'Fila não encontrada ou concluída.' }, {
    status: result ? 200 : 400,
  });
}

// A visible panel can pulse safely; the protected cron handles a closed panel.
export async function PATCH() {
  const auth = await requireApiPermission('crm:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json(await processRepique());
}
