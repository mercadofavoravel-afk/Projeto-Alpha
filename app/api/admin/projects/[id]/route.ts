import { NextResponse } from "next/server";

import { audit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth";
import { projectEditorSchema } from "@/lib/cms/project-schema";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const auth = await requireApiPermission("catalog:write");

  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status },
    );
  }

  const { id } = await context.params;

  const project = await db.project.findUnique({
    where: {
      id,
    },
    include: {
      neighborhood: true,
      developer: true,
      media: {
        orderBy: {
          position: "asc",
        },
      },
      typologies: true,
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Empreendimento não encontrado" },
      { status: 404 },
    );
  }

  return NextResponse.json(project);
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  const auth = await requireApiPermission("catalog:write");

  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status },
    );
  }

  const { id } = await context.params;
  const body: unknown = await request.json();

  const parsed = projectEditorSchema
    .innerType()
    .partial()
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const project = await db.project.update({
    where: {
      id,
    },
    data: parsed.data,
  });

  await audit(
    "project.updated",
    "Project",
    id,
    auth.user.id,
    {
      fields: Object.keys(parsed.data),
    },
  );

  return NextResponse.json(project);
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const auth = await requireApiPermission("catalog:write");

  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status },
    );
  }

  const { id } = await context.params;

  const project = await db.project.update({
    where: {
      id,
    },
    data: {
      publishStatus: "ARCHIVED",
    },
  });

  await audit(
    "project.archived",
    "Project",
    id,
    auth.user.id,
  );

  return NextResponse.json({
    ok: true,
    project,
  });
}

