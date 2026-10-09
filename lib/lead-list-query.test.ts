import { describe, expect, it } from 'vitest';

import { buildLeadListWhere, parseLeadRiskFilter } from './lead-list-query';

const now = new Date('2026-10-05T18:00:00.000Z');

describe('lead list risk filters', () => {
  it('keeps only known risk names from a URL', () => {
    expect(parseLeadRiskFilter('stalled')).toBe('stalled');
    expect(parseLeadRiskFilter('all')).toBeUndefined();
  });

  it('combines stalled risk with the manager scope and selected professional', () => {
    const where = buildLeadListWhere(
      { responsible: 'corretor-1' },
      { id: 'gerente-1', role: 'MANAGER' },
      undefined,
      'stalled',
      now,
    );
    expect(where.AND).toContainEqual({ assignedToId: 'corretor-1' });
    expect(where.AND).toContainEqual({
      OR: [{ assignedToId: 'gerente-1' }, { assignedTo: { managerId: 'gerente-1' } }],
    });
    expect(where.AND).toContainEqual(
      expect.objectContaining({
        AND: expect.arrayContaining([expect.objectContaining({ activities: expect.any(Object) })]),
      }),
    );
  });

  it('never exposes the unassigned queue to a consultant through a URL', () => {
    const where = buildLeadListWhere(
      {},
      { id: 'corretor-1', role: 'CONSULTANT' },
      'unassigned',
      'unassigned',
      now,
    );
    expect(where.AND).toContainEqual({ assignedToId: 'corretor-1' });
    expect(where.AND).toContainEqual({ id: { in: [] } });
  });
});
