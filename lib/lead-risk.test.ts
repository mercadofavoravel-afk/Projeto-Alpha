import { describe, expect, it } from 'vitest';

import { leadRiskQueries } from './lead-risk';

const now = new Date('2026-10-05T18:00:00.000Z');

describe('leadRiskQueries', () => {
  it('keeps a consultant within their own assigned leads and excludes the unassigned queue', () => {
    const queries = leadRiskQueries({ id: 'corretor-1', role: 'CONSULTANT' }, now);
    expect(queries.unassigned).toBeUndefined();
    for (const query of Object.values(queries)) {
      expect(query.AND).toContainEqual({ assignedToId: 'corretor-1' });
    }
  });

  it('requires a completed contact to clear first response and stalled alerts', () => {
    const queries = leadRiskQueries({ id: 'admin-1', role: 'ADMIN' }, now);
    expect(queries.unassigned?.AND).toContainEqual({
      assignedToId: null,
      createdAt: { lt: new Date('2026-10-05T17:45:00.000Z') },
    });
    expect(queries.stalled?.AND).toContainEqual({
      activities: {
        none: {
          type: { in: ['CALL', 'WHATSAPP', 'EMAIL', 'VISIT'] },
          dueAt: null,
          completedAt: { gte: new Date('2026-10-03T18:00:00.000Z') },
        },
      },
    });
    expect(queries.firstContact?.AND).toContainEqual({
      status: { notIn: ['WON', 'LOST'] },
      assignedToId: { not: null },
      createdAt: { lt: new Date('2026-10-05T17:45:00.000Z') },
    });
    expect(queries.firstContact?.AND).toContainEqual({
      activities: {
        none: {
          type: { in: ['CALL', 'WHATSAPP', 'EMAIL', 'VISIT'] },
          dueAt: null,
          completedAt: { not: null },
        },
      },
    });
  });

  it('applies the manager team scope to every alert', () => {
    const queries = leadRiskQueries({ id: 'gerente-1', role: 'MANAGER' }, now);
    expect(queries.unassigned).toBeUndefined();
    for (const query of Object.values(queries)) {
      expect(query.AND).toContainEqual({
        OR: [{ assignedToId: 'gerente-1' }, { assignedTo: { managerId: 'gerente-1' } }],
      });
    }
  });
});
