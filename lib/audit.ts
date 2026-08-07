import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export async function audit(
  action: string,
  entityType: string,
  entityId: string | undefined,
  userId: string | undefined,
  metadata?: Record<string, unknown>,
) {
  return db.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      metadata: metadata
        ? (metadata as Prisma.InputJsonValue)
        : undefined,
    },
  });
}
