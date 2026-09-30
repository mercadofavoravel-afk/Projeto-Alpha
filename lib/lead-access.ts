import type { Prisma, UserRole } from '@prisma/client';

type LeadViewer = { id: string; role: UserRole };

export function canViewAllLeads(role: UserRole) {
  return role === 'ADMIN' || role === 'DIRECTOR' || role === 'MANAGER';
}

export function leadAccessWhere(user: LeadViewer): Prisma.LeadWhereInput {
  if (user.role === 'ADMIN' || user.role === 'DIRECTOR') return {};
  if (user.role === 'MANAGER') {
    return {
      OR: [{ assignedToId: user.id }, { assignedTo: { managerId: user.id } }],
    };
  }
  return { assignedToId: user.id };
}

export function canViewUnassignedLeads(role: UserRole) {
  return role === 'ADMIN' || role === 'DIRECTOR';
}

export function leadAssignmentWhere(
  user: LeadViewer,
  assignment: string | undefined,
): Prisma.LeadWhereInput {
  if (!canViewUnassignedLeads(user.role)) return {};
  if (assignment === 'unassigned') return { assignedToId: null };
  if (assignment === 'assigned') return { assignedToId: { not: null } };
  return {};
}

export function canAccessLead(
  user: LeadViewer,
  assignedToId: string | null,
  assignedToManagerId: string | null = null,
) {
  return (
    canViewUnassignedLeads(user.role) ||
    assignedToId === user.id ||
    (user.role === 'MANAGER' && assignedToManagerId === user.id)
  );
}
