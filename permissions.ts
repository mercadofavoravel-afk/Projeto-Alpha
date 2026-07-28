import type { UserRole } from "@prisma/client";

export const permissions = {
  ADMIN: ["admin:access", "users:manage", "catalog:write", "catalog:publish", "crm:write", "analytics:read", "media:write"],
  EDITOR: ["admin:access", "catalog:write", "catalog:publish", "analytics:read", "media:write"],
  CONSULTANT: ["admin:access", "crm:write", "analytics:read"],
  MARKETING: ["admin:access", "catalog:write", "analytics:read", "media:write"],
  VIEWER: ["admin:access", "analytics:read"]
} as const satisfies Record<UserRole, readonly string[]>;

export type Permission = (typeof permissions)[UserRole][number];

export function hasPermission(role: UserRole, permission: string) {
  return permissions[role].includes(permission as never);
}
