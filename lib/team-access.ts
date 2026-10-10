import type { Prisma, UserRole } from '@prisma/client';

export function matrixTeamWhere(actor: { id: string; role: UserRole }): Prisma.UserWhereInput {
  const salesRoles: UserRole[] = ['DIRECTOR', 'MANAGER', 'CONSULTANT'];
  if (actor.role === 'MANAGER') {
    return {
      AND: [
        { billingMode: 'INTERNAL' },
        {
          OR: [
            { id: actor.id, role: 'MANAGER' },
            { managerId: actor.id, role: 'CONSULTANT' },
          ],
        },
      ],
    };
  }
  return { billingMode: 'INTERNAL', role: { in: salesRoles } };
}
