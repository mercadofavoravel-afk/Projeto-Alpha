import type { UserRole } from "@prisma/client";

export const permissions = {
  ADMIN: [
    "admin:access",
    "users:manage",

    "catalog:write",
    "catalog:publish",

    "crm:read",
    "crm:write",
    "crm:manage",
    "crm:assign",
    "crm:reports",

    "analytics:read",
    "media:write",
  ],

  EDITOR: [
    "admin:access",

    "catalog:write",
    "catalog:publish",

    "analytics:read",
    "media:write",
  ],

  CONSULTANT: [
    "admin:access",

    "crm:read",
    "crm:write",

    "analytics:read",
  ],

  MARKETING: [
    "admin:access",

    "catalog:write",
    "media:write",

    "crm:read",
    "crm:reports",

    "analytics:read",
  ],

  VIEWER: [
    "admin:access",

    "crm:read",
    "analytics:read",
  ],
} as const satisfies Record<UserRole, readonly string[]>;

export type Permission =
  (typeof permissions)[UserRole][number];

export function hasPermission(
  role: UserRole,
  permission: string,
): boolean {
  return permissions[role].includes(permission as never);
}
