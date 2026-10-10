import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiPermission } from '@/lib/auth';
import { assignableSubscriptionWhere } from '@/lib/commercial-subscription';
import { db } from '@/lib/db';
import { leadAccessWhere } from '@/lib/lead-access';

const assignmentSchema = z.object({ assignedToId: z.string().cuid().nullable() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission('crm:assign');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = assignmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Responsável inválido.' }, { status: 400 });

  const { id } = await context.params;
  const targetId = parsed.data.assignedToId;
  if (auth.user.role === 'MANAGER' && !targetId)
    return NextResponse.json(
      { error: 'A gestão central controla a fila sem responsável.' },
      { status: 403 },
    );
  if (targetId) {
    const target = await db.user.findFirst({
      where: {
        AND: [
          assignableSubscriptionWhere(),
          auth.user.role === 'MANAGER'
            ? {
                id: targetId,
                isActive: true,
                OR: [
                  { id: auth.user.id, role: 'MANAGER' },
                  { role: 'CONSULTANT', managerId: auth.user.id },
                ],
              }
            : { id: targetId, isActive: true, role: { in: ['DIRECTOR', 'MANAGER', 'CONSULTANT'] } },
        ],
      },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ error: 'Profissional indisponível.' }, { status: 400 });
  }

  const result = await db.$transaction(async (transaction) => {
    const lead = await transaction.lead.findFirst({
      where: { id, ...leadAccessWhere(auth.user) },
      select: { id: true, assignedToId: true },
    });
    if (!lead) return null;
    if (lead.assignedToId === targetId) return lead;

    await transaction.lead.update({ where: { id }, data: { assignedToId: targetId } });
    await transaction.leadActivity.create({
      data: {
        leadId: id,
        type: 'NOTE',
        note: targetId
          ? 'Responsável pelo lead alterado pela gestão.'
          : 'Lead devolvido à fila da gestão.',
      },
    });
    await transaction.auditLog.create({
      data: {
        action: 'lead.assigned',
        entityType: 'Lead',
        entityId: id,
        userId: auth.user.id,
        metadata: { previousUserId: lead.assignedToId, newUserId: targetId },
      },
    });
    return lead;
  });

  if (!result) return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
