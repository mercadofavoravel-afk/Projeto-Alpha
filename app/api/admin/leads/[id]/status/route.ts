import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { leadAccessWhere } from '@/lib/lead-access';

const statusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'VISIT_SCHEDULED', 'WON', 'LOST']),
});

const statusLabels: Record<z.infer<typeof statusSchema>['status'], string> = {
  NEW: 'Novo',
  CONTACTED: 'Em atendimento',
  QUALIFIED: 'Qualificado',
  VISIT_SCHEDULED: 'Visita agendada',
  WON: 'Fechado',
  LOST: 'Encerrado ou descadastrado',
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireApiPermission('crm:write');

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = statusSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
  }

  const { id } = await params;
  const lead = await db.lead.findFirst({
    where: {
      id,
      ...leadAccessWhere(auth.user),
    },
    select: {
      id: true,
    },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
  }

  const now = new Date();
  const shouldStopFollowUps = parsed.data.status !== 'NEW';

  const updated = await db.$transaction(async (transaction) => {
    const result = await transaction.lead.updateMany({
      where: { id, ...leadAccessWhere(auth.user) },
      data: { status: parsed.data.status },
    });
    if (result.count === 0) return false;

    if (shouldStopFollowUps) {
      const completedFollowUps = await transaction.leadActivity.updateMany({
        where: {
          leadId: id,
          type: 'WHATSAPP',
          dueAt: {
            not: null,
          },
          completedAt: null,
        },
        data: {
          completedAt: now,
        },
      });

      if (completedFollowUps.count > 0) {
        await transaction.leadActivity.create({
          data: {
            leadId: id,
            type: 'NOTE',
            completedAt: now,
            note: `Sequência de follow-ups interrompida: ${statusLabels[parsed.data.status]}.`,
          },
        });
      }
    }
    return true;
  });

  if (!updated) return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
