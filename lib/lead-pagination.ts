export const leadsPerPage = 100;

export function resolveLeadPage(value: string | undefined, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / leadsPerPage));
  const requested = value && /^[1-9]\d*$/.test(value) ? Number(value) : 1;
  const page = Math.min(Number.isSafeInteger(requested) ? requested : 1, totalPages);

  return { page, totalPages, skip: (page - 1) * leadsPerPage };
}

export function leadPageHref(filters: URLSearchParams, page: number) {
  const params = new URLSearchParams(filters);
  if (page > 1) params.set('page', String(page));
  else params.delete('page');
  return `/admin/leads${params.size ? `?${params.toString()}` : ''}`;
}
