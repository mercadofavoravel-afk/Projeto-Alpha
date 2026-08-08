import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projectSchema } from '@/lib/validation';
import { requireApiPermission } from '@/lib/auth';
export async function GET() {
  const auth = await requireApiPermission('catalog:write');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const projects = await db.project.findMany({
    include: {
      neighborhood: true,
      developer: true,
      typologies: true,
      collections: { include: { collection: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ data: projects, total: projects.length });
}
export async function POST(request: Request) {
  const auth = await requireApiPermission('catalog:write');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = projectSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 },
    );
  const project = await db.project.create({ data: parsed.data });
  return NextResponse.json({ ok: true, project }, { status: 201 });
}
