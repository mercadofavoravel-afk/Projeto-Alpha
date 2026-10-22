import { describe, expect, it } from 'vitest';
import { kanbanPageHref, kanbanPageSize } from './lead-kanban';
import { resolveLeadPage } from './lead-pagination';

describe('navegação do Kanban', () => {
  it('alcança contatos após os primeiros 200 sem mudar a página das outras etapas', () => {
    expect(resolveLeadPage('11', 251, kanbanPageSize)).toEqual({
      page: 11,
      totalPages: 11,
      skip: 250,
    });
    const href = kanbanPageHref({ NEW: 10, CONTACTED: 3 }, 'NEW', 11);
    expect(href).toBe('/admin/leads/kanban?page_NEW=11&page_CONTACTED=3');
    expect(kanbanPageHref({ NEW: 2, WON: 2 }, 'NEW', 1)).toBe('/admin/leads/kanban?page_WON=2');
  });
  it('não propaga páginas inválidas nos links', () => {
    expect(kanbanPageHref({ NEW: Infinity, LOST: -1 }, 'NEW', NaN)).toBe('/admin/leads/kanban');
    expect(resolveLeadPage('999', 26, kanbanPageSize)).toEqual({
      page: 2,
      totalPages: 2,
      skip: 25,
    });
  });
});
