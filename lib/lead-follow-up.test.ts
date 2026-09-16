import { describe, expect, it } from 'vitest';

import { createOrganicFollowUpActivities } from './lead-follow-up';

describe('organic follow-up activities', () => {
  it('creates the 3rd and 5th day CRM tasks with the article origin', () => {
    const activities = createOrganicFollowUpActivities(
      {
        id: 'lead-1',
        name: 'Ana',
        neighborhood: 'Ipanema',
        source: 'Orgânico | artigo: Investir em Ipanema | região: Ipanema',
      },
      new Date('2026-09-16T12:00:00.000Z'),
    );

    expect(activities).toHaveLength(2);
    expect(activities.map((activity) => activity.dueAt.toISOString())).toEqual([
      '2026-09-19T12:00:00.000Z',
      '2026-09-21T12:00:00.000Z',
    ]);
    expect(activities[0].note).toContain('artigo: Investir em Ipanema');
    expect(activities[0].note).toContain('Mensagem sugerida (não enviada automaticamente)');
  });
});
