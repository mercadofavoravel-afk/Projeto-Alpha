import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';

const analyticsEventSchema = z.object({
  name: z.string().min(2).max(120),
  path: z.string().max(500).optional(),
  sessionKey: z.string().max(120).optional(),
  projectId: z.string().cuid().optional(),
  profileId: z.string().cuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  const parsed = analyticsEventSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Evento inválido',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { name, path, sessionKey, projectId, profileId, metadata } = parsed.data;

  const data: Prisma.AnalyticsEventUncheckedCreateInput = {
    name,
    path,
    sessionKey,
    projectId,
    profileId,
    metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
  };

  const event = await db.analyticsEvent.create({
    data,
  });

  return NextResponse.json(
    {
      ok: true,
      id: event.id,
    },
    { status: 201 },
  );
}
