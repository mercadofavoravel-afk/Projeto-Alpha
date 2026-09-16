import { NextResponse } from 'next/server';

import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';

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
  const activity = await db.leadActivity.findUnique({
    where: {
      id,
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

  await db.leadActivity.update({
    where: {
      id,
    },
    data: {
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
