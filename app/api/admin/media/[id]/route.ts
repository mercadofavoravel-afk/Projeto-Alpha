import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission('media:write');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const parsed = z.object({ position: z.number().int().min(-50) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Prioridade inválida' }, { status: 400 });

  const media = await db.media.findUnique({ where: { id }, select: { kind: true } });
  if (!media || media.kind !== 'IMAGE') {
    return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });
  }

  return NextResponse.json(await db.media.update({ where: { id }, data: parsed.data }));
}
