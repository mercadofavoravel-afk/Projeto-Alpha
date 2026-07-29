import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiPermission } from "@/lib/auth";
import { projectEditorSchema } from "@/lib/cms/project-schema";
import { audit } from "@/lib/audit";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission("catalog:write");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await context.params;
  const project = await db.project.findUnique({
    where: { id },
    include: { neighborhood: true, developer: true, media: { orderBy: { position: "asc" } }, typologies: true }
  });
  if (!project) return NextResponse.json({ error: "Empreendimento não encontrado" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission("catalog:write");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await context.params;
  const parsed = projectEditorSchema.partial().safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  const project = await db.project.update({ where: { id }, data: parsed.data });
  await audit({ userId: auth.user.id, action: "project.updated", entity: "Project", entityId: id, metadata: { fields: Object.keys(parsed.data) } });
  return NextResponse.json(project);
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission("catalog:write");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await context.params;
  await db.project.update({ where: { id }, data: { publishStatus: "ARCHIVED" } });
  await audit({ userId: auth.user.id, action: "project.archived", entity: "Project", entityId: id });
  return NextResponse.json({ ok: true });
}
