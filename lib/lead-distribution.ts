export type DistributionCandidate = {
  id: string;
  activeLeadCount: number;
  leadCapacity: number;
  serviceRegions: string[];
  lastLeadAssignedAt: Date | null;
};

function normalized(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

export function candidateCanReceive(candidate: DistributionCandidate, region?: string | null) {
  if (candidate.activeLeadCount >= candidate.leadCapacity) return false;
  if (candidate.serviceRegions.length === 0 || !region) return true;
  const target = normalized(region);
  return candidate.serviceRegions.some((item) => normalized(item) === target);
}

export function chooseAssignee(candidates: DistributionCandidate[], region?: string | null) {
  return (
    candidates
      .filter((candidate) => candidateCanReceive(candidate, region))
      .sort((first, second) => {
        const firstLoad = first.activeLeadCount / Math.max(1, first.leadCapacity);
        const secondLoad = second.activeLeadCount / Math.max(1, second.leadCapacity);
        if (firstLoad !== secondLoad) return firstLoad - secondLoad;
        return (
          (first.lastLeadAssignedAt?.getTime() || 0) - (second.lastLeadAssignedAt?.getTime() || 0)
        );
      })[0] ?? null
  );
}
