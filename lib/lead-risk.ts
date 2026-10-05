import type { Prisma, UserRole } from '@prisma/client';

import { canViewUnassignedLeads, leadAccessWhere } from './lead-access';

type Viewer = { id: string; role: UserRole };

export const firstContactMinutes = 15;
export const stalledHours = 48;
const contactTypes = ['CALL', 'WHATSAPP', 'EMAIL', 'VISIT'];

export function leadRiskQueries(viewer: Viewer, now: Date): Record<string, Prisma.LeadWhereInput> {
  const firstContactCutoff = new Date(now.getTime() - firstContactMinutes * 60_000);
  const stalledCutoff = new Date(now.getTime() - stalledHours * 3_600_000);
  const scope = leadAccessWhere(viewer);
  const active: Prisma.LeadWhereInput = { status: { notIn: ['WON', 'LOST'] } };

  return {
    ...(canViewUnassignedLeads(viewer.role)
      ? {
          unassigned: {
            AND: [scope, active, { assignedToId: null, createdAt: { lt: firstContactCutoff } }],
          },
        }
      : {}),
    firstContact: {
      AND: [
        scope,
        { status: 'NEW', assignedToId: { not: null }, createdAt: { lt: firstContactCutoff } },
        {
          activities: {
            none: {
              OR: [{ completedAt: { not: null } }, { type: { in: contactTypes }, dueAt: null }],
            },
          },
        },
      ],
    },
    overdueFollowUp: {
      AND: [
        scope,
        { status: { in: ['CONTACTED', 'QUALIFIED', 'VISIT_SCHEDULED'] } },
        { activities: { some: { completedAt: null, dueAt: { lt: now } } } },
      ],
    },
    stalled: {
      AND: [
        scope,
        {
          status: { in: ['CONTACTED', 'QUALIFIED', 'VISIT_SCHEDULED'] },
          createdAt: { lt: stalledCutoff },
        },
        {
          activities: {
            none: {
              OR: [
                { completedAt: { gte: stalledCutoff } },
                { type: { in: contactTypes }, dueAt: null, createdAt: { gte: stalledCutoff } },
              ],
            },
          },
        },
      ],
    },
  };
}
