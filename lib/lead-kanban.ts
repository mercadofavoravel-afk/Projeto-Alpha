import { leadStatuses } from './lead-filters';

export const kanbanPageSize = 25;
export type KanbanStatus = (typeof leadStatuses)[number];

export function kanbanPageHref(
  pages: Partial<Record<KanbanStatus, number>>,
  status: KanbanStatus,
  page: number,
) {
  const params = new URLSearchParams();
  for (const stage of leadStatuses) {
    const value = stage === status ? page : pages[stage];
    if (value && Number.isSafeInteger(value) && value > 1)
      params.set(`page_${stage}`, String(value));
  }
  return `/admin/leads/kanban${params.size ? `?${params}` : ''}`;
}
