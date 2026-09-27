import { describe, expect, it } from 'vitest';
import { leadPageHref, resolveLeadPage } from './lead-pagination';

describe('CRM lead pagination', () => {
  it('clamps invalid, oversized and out-of-range pages to the available results', () => {
    expect(resolveLeadPage('2', 201)).toEqual({ page: 2, totalPages: 3, skip: 100 });
    expect(resolveLeadPage('999', 201)).toEqual({ page: 3, totalPages: 3, skip: 200 });
    expect(resolveLeadPage('-1', 201).page).toBe(1);
    expect(resolveLeadPage('2e2', 201).page).toBe(1);
    expect(resolveLeadPage('999999999999999999999', 201).page).toBe(1);
    expect(resolveLeadPage('2', 0)).toEqual({ page: 1, totalPages: 1, skip: 0 });
  });

  it('preserves channel, campaign, status and assignment when navigating', () => {
    const filters = new URLSearchParams({
      channel: 'organic',
      campaign: 'Barra & Recreio',
      status: 'NEW',
      assignment: 'unassigned',
    });

    const href = leadPageHref(filters, 2);
    const url = new URL(href, 'https://example.com');
    expect(url.pathname).toBe('/admin/leads');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      channel: 'organic',
      campaign: 'Barra & Recreio',
      status: 'NEW',
      assignment: 'unassigned',
      page: '2',
    });
    expect(leadPageHref(filters, 1)).not.toContain('page=');
  });
});
