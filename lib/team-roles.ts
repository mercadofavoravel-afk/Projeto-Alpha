import type { UserRole } from '@prisma/client';

export const employeeRoles = [
  'DIRECTOR',
  'MANAGER',
  'CONSULTANT',
  'EDITOR',
  'MARKETING',
  'VIEWER',
] as const satisfies readonly UserRole[];

export function canManageEmployeeRole(actor: UserRole, target: UserRole): boolean {
  if (actor === 'ADMIN') return target !== 'ADMIN';
  return actor === 'DIRECTOR' && (target === 'MANAGER' || target === 'CONSULTANT');
}
