import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { processRepique } from '@/lib/lead-repique';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Rotina indisponível.' }, { status: 503 });
  const supplied = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  try {
    const result = await processRepique();
    await db.auditLog.create({
      data: {
        action: 'lead.repique_server_tick',
        entityType: 'RepiqueScheduler',
        metadata: result,
      },
    });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Não foi possível processar a fila.' }, { status: 503 });
  }
}
