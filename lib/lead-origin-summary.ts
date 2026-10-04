import { contentFromSource } from './lead-origin';

type LeadOriginGroup = {
  source: string | null;
  neighborhood: string | null;
  _count: { _all: number };
};

function topFive(counts: Map<string, number>) {
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label))
    .slice(0, 5);
}

export function summarizeLeadOrigins(groups: LeadOriginGroup[]) {
  const byContent = new Map<string, number>();
  const byRegion = new Map<string, number>();
  let total = 0;
  let contentLeads = 0;

  for (const group of groups) {
    total += group._count._all;
    const content = contentFromSource(group.source);
    if (!content) continue;

    contentLeads += group._count._all;
    byContent.set(content, (byContent.get(content) ?? 0) + group._count._all);
    const region = group.neighborhood || 'Rio de Janeiro';
    byRegion.set(region, (byRegion.get(region) ?? 0) + group._count._all);
  }

  return {
    total,
    contentLeads,
    contentCount: byContent.size,
    regionCount: byRegion.size,
    byContent: topFive(byContent),
    byRegion: topFive(byRegion),
  };
}
