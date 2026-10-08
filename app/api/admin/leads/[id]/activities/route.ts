import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireApiPermission } from '@/lib/auth';
import { leadAccessWhere } from '@/lib/lead-access';
import { contactTypes } from '@/lib/lead-risk';
import { firstContactNotePrefix } from '@/lib/lead-follow-up';

const activitySchema = z.object({
  type: z.enum(['NOTE', 'CALL', 'WHATSAPP', 'EMAIL', 'VISIT', 'TASK']),
  note: z.string().trim().max(2000).optional(),
  dueAt: z.coerce.date().optional(),
});

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission('crm:read');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const lead = await db.lead.findFirst({
    where: { id, ...leadAccessWhere(auth.user) },
    select: { id: true },
  });
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
  return NextResponse.json(
    await db.leadActivity.findMany({ where: { leadId: id }, orderBy: { createdAt: 'desc' } }),
  );
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission('crm:write');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const parsed = activitySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Atividade inválida', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  // A dated activity is a future reminder. Only a completed contact confirms first response.
  const completedAt =
    !parsed.data.dueAt && contactTypes.includes(parsed.data.type) ? new Date() : undefined;
  const activity = await db.$transaction(async (transaction) => {
    const lead = await transaction.lead.findFirst({
      where: { id, ...leadAccessWhere(auth.user) },
      select: { id: true },
    });
    if (!lead) return null;

    const created = await transaction.leadActivity.create({
      data: { ...parsed.data, leadId: id, completedAt },
    });
    if (completedAt) {
      await transaction.lead.updateMany({
        where: { id, status: 'NEW' },
        data: { status: 'CONTACTED' },
      });
      await transaction.leadActivity.updateMany({
        where: {
          leadId: id,
          type: 'TASK',
          note: { startsWith: firstContactNotePrefix },
          completedAt: null,
        },
        data: { completedAt },
      });
    }
    await transaction.auditLog.create({
      data: {
        action: 'lead.activity_created',
        entityType: 'Lead',
        entityId: id,
        userId: auth.user.id,
        metadata: { type: parsed.data.type, completedContact: Boolean(completedAt) },
      },
    });
    return created;
  });
  if (!activity) return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });

  return NextResponse.json(activity, { status: 201 });
}
