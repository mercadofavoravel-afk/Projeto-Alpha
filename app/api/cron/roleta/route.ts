import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { processRouletteQueues } from '@/lib/lead-routing';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Rotina não configurada.' }, { status: 503 });
  const received = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
  if (received.length !== expected.length || !timingSafeEqual(received, expected))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  try {
    const result = await processRouletteQueues();
    await db.auditLog.create({
      data: {
        action: 'lead.roulette_server_tick',
        entityType: 'RouletteScheduler',
        metadata: result,
      },
    });
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Falha temporária na roleta.' }, { status: 503 });
  }
}
