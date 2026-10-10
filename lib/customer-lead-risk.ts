import type { Prisma } from '@prisma/client';

import { contactTypes, firstContactMinutes, stalledHours } from '@/lib/lead-risk';

export function customerLeadRiskQueries(
  siteId: string,
  now = new Date(),
): Record<'firstContact' | 'overdue' | 'stalled', Prisma.CustomerLeadWhereInput> {
  const firstContactCutoff = new Date(now.getTime() - firstContactMinutes * 60_000);
  const stalledCutoff = new Date(now.getTime() - stalledHours * 3_600_000);
  const active: Prisma.CustomerLeadWhereInput = {
    siteId,
    status: { notIn: ['WON', 'LOST'] },
  };
  return {
    firstContact: {
      AND: [
        active,
        { createdAt: { lt: firstContactCutoff } },
        {
          activities: {
            none: { type: { in: contactTypes }, completedAt: { not: null } },
          },
        },
      ],
    },
    overdue: {
      AND: [active, { activities: { some: { completedAt: null, dueAt: { lt: now } } } }],
    },
    stalled: {
      AND: [
        active,
        { status: { in: ['CONTACTED', 'QUALIFIED', 'VISIT_SCHEDULED'] } },
        { createdAt: { lt: stalledCutoff } },
        {
          activities: {
            none: {
              type: { in: contactTypes },
              completedAt: { gte: stalledCutoff },
            },
          },
        },
      ],
    },
  };
}
