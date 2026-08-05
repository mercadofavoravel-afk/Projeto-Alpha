import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiPermission } from "@/lib/auth";
import { audit } from "@/lib/audit";

const activitySchema = z.object({
  type: z.enum(["NOTE", "CALL", "WHATSAPP", "EMAIL", "VISIT", "TASK"]),
  note: z.string().trim().max(2000).optional(),
  dueAt: z.coerce.date().optional()
});

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission("crm:write");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  return NextResponse.json(
    await db.leadActivity.findMany({ where: { leadId: id }, orderBy: { createdAt: "desc" } })
  );
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission("crm:write");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const parsed = activitySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Atividade inválida", details: parsed.error.flatten() }, { status: 400 });
  }
  const activity = await db.leadActivity.create({ data: { ...parsed.data, leadId: id } });
  await audit(
  "lead.activity_created",
  "Lead",
  id,
  auth.user.id,
  { type: parsed.data.type },
);

return NextResponse.json(activity, { status: 201 });
}
