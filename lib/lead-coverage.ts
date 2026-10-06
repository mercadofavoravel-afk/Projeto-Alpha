import { candidateCanReceive, type DistributionCandidate } from './lead-distribution';

export type UnassignedRegionGroup = {
  neighborhood: string | null;
  _count: { _all: number };
  _min: { createdAt: Date | null };
};

export function summarizeUnassignedCoverage(
  groups: UnassignedRegionGroup[],
  candidates: DistributionCandidate[],
) {
  const regions = groups
    .map((group) => {
      const available = candidates.filter((candidate) =>
        candidateCanReceive(candidate, group.neighborhood),
      );
      return {
        region: group.neighborhood || 'Região não informada',
        count: group._count._all,
        oldestAt: group._min.createdAt,
        availableProfessionals: available.length,
        freeCapacity: available.reduce(
          (sum, candidate) => sum + candidate.leadCapacity - candidate.activeLeadCount,
          0,
        ),
      };
    })
    .sort(
      (a, b) =>
        Number(a.availableProfessionals > 0) - Number(b.availableProfessionals > 0) ||
        (a.oldestAt?.getTime() || 0) - (b.oldestAt?.getTime() || 0) ||
        a.region.localeCompare(b.region, 'pt-BR'),
    );

  return {
    regions,
    total: regions.reduce((sum, region) => sum + region.count, 0),
    withoutCoverage: regions.reduce(
      (sum, region) => sum + (region.availableProfessionals ? 0 : region.count),
      0,
    ),
  };
}
