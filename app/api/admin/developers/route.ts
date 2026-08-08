import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireApiPermission } from '@/lib/auth';
import { createSlug } from '@/lib/slug';

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(4000).optional(),
  website: z.string().trim().url().or(z.literal('')).optional(),
});

export async function GET() {
  const auth = await requireApiPermission('catalog:write');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const data = await db.developer.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission('catalog:write');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 },
    );
  const developer = await db.developer.create({
    data: {
      ...parsed.data,
      website: parsed.data.website || null,
      slug: createSlug(parsed.data.name),
    },
  });
  return NextResponse.json({ ok: true, developer }, { status: 201 });
}
