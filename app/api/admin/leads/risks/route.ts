import { NextResponse } from 'next/server';

import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { leadRiskQueries } from '@/lib/lead-risk';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireApiPermission('crm:read');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const queries = leadRiskQueries(auth.user, new Date());
  const counts = Object.fromEntries(
    await Promise.all(
      Object.entries(queries).map(async ([kind, where]) => [kind, await db.lead.count({ where })]),
    ),
  );

  return NextResponse.json(counts, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
