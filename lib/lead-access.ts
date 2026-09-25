import type { Prisma, UserRole } from '@prisma/client';

type LeadViewer = { id: string; role: UserRole };

export function canViewAllLeads(role: UserRole) {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function leadAccessWhere(user: LeadViewer): Prisma.LeadWhereInput {
  return canViewAllLeads(user.role) ? {} : { assignedToId: user.id };
}

export function canAccessLead(user: LeadViewer, assignedToId: string | null) {
  return canViewAllLeads(user.role) || assignedToId === user.id;
}
