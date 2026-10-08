import type { Prisma, UserRole } from '@prisma/client';

export function commercialTeamWhere(actor: { id: string; role: UserRole }): Prisma.UserWhereInput {
  const salesRoles: UserRole[] = ['DIRECTOR', 'MANAGER', 'CONSULTANT'];
  if (actor.role === 'MANAGER') {
    return {
      OR: [
        { id: actor.id, role: 'MANAGER' },
        { managerId: actor.id, role: 'CONSULTANT' },
      ],
    };
  }
  return { role: { in: salesRoles } };
}
