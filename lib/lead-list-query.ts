import type { Prisma, UserRole } from '@prisma/client';

import { leadAccessWhere, leadAssignmentWhere } from './lead-access';
import { buildLeadWhere, type LeadFilters } from './lead-filters';
import { leadRiskQueries } from './lead-risk';

export const leadRiskFilters = [
  'unassigned',
  'firstContact',
  'overdueFollowUp',
  'stalled',
] as const;

export type LeadRiskFilter = (typeof leadRiskFilters)[number];

export function parseLeadRiskFilter(value: string | undefined): LeadRiskFilter | undefined {
  return leadRiskFilters.find((risk) => risk === value);
}

export function buildLeadListWhere(
  filters: LeadFilters,
  user: { id: string; role: UserRole },
  assignment: string | undefined,
  risk: LeadRiskFilter | undefined,
  now: Date,
): Prisma.LeadWhereInput {
  const riskQuery = risk && leadRiskQueries(user, now)[risk];
  return {
    AND: [
      buildLeadWhere(filters),
      leadAccessWhere(user),
      leadAssignmentWhere(user, assignment),
      // A URL requesting a risk outside this role's scope must never show the full list.
      ...(risk ? [riskQuery ?? { id: { in: [] } }] : []),
    ],
  };
}
