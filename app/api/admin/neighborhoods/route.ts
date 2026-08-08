import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireApiPermission } from '@/lib/auth';
import { createSlug } from '@/lib/slug';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(4000).optional(),
  heroImage: z.string().trim().url().or(z.literal('')).optional(),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(180).optional(),
});

export async function GET() {
  const auth = await requireApiPermission('catalog:write');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const data = await db.neighborhood.findMany({
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
  const slug = createSlug(parsed.data.name);
  const neighborhood = await db.neighborhood.create({
    data: { ...parsed.data, heroImage: parsed.data.heroImage || null, slug },
  });
  return NextResponse.json({ ok: true, neighborhood }, { status: 201 });
}
