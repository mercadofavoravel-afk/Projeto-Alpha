import type { UserRole } from '@prisma/client';

export const permissions = {
  ADMIN: [
    'admin:access',
    'sites:manage',
    'users:manage',

    'catalog:write',
    'catalog:publish',

    'crm:read',
    'crm:write',
    'crm:manage',
    'crm:assign',
    'crm:reports',

    'analytics:read',
    'media:write',
  ],

  DIRECTOR: [
    'admin:access',
    'sites:manage',
    'users:manage',
    'catalog:write',
    'catalog:publish',
    'crm:read',
    'crm:write',
    'crm:manage',
    'crm:assign',
    'crm:reports',
    'analytics:read',
    'media:write',
  ],

  MANAGER: ['admin:access', 'sites:manage', 'crm:read', 'crm:write', 'crm:assign', 'crm:reports'],

  EDITOR: [
    'admin:access',
    'sites:manage',
    'catalog:write',
    'catalog:publish',
    'analytics:read',
    'media:write',
  ],

  CONSULTANT: ['admin:access', 'crm:read', 'crm:write'],

  MARKETING: [
    'admin:access',
    'sites:manage',

    'catalog:write',
    'media:write',

    'crm:read',
    'crm:reports',

    'analytics:read',
  ],

  VIEWER: ['admin:access', 'crm:read', 'analytics:read'],
} as const satisfies Record<UserRole, readonly string[]>;

export type Permission = (typeof permissions)[UserRole][number];

export function hasPermission(role: UserRole, permission: string): boolean {
  return permissions[role].includes(permission as never);
}
