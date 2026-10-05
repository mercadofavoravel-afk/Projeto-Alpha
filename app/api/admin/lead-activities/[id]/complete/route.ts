import { NextResponse } from 'next/server';

import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { leadAccessWhere } from '@/lib/lead-access';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_: Request, { params }: RouteContext) {
  const auth = await requireApiPermission('crm:write');

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const activity = await db.leadActivity.findFirst({
    where: {
      id,
      lead: leadAccessWhere(auth.user),
    },
    select: {
      id: true,
      completedAt: true,
    },
  });

  if (!activity) {
    return NextResponse.json({ error: 'Acompanhamento não encontrado.' }, { status: 404 });
  }

  if (activity.completedAt) {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  const completedAt = new Date();
  const result = await db.$transaction(async (transaction) => {
    const updated = await transaction.leadActivity.updateMany({
      where: { id, completedAt: null, lead: leadAccessWhere(auth.user) },
      data: { completedAt },
    });
    if (updated.count > 0) {
      await transaction.auditLog.create({
        data: {
          action: 'lead.activity_completed',
          entityType: 'LeadActivity',
          entityId: id,
          userId: auth.user.id,
          metadata: { completedAt: completedAt.toISOString() },
        },
      });
    }
    return updated;
  });

  if (result.count === 0)
    return NextResponse.json({ error: 'Acompanhamento não encontrado.' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
