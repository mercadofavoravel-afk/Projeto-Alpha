import { describe, expect, it } from 'vitest';

import { createOrganicFollowUpActivities } from './lead-follow-up';

describe('organic follow-up activities', () => {
  it('creates an immediate first-contact task and 3rd/5th day follow-ups with origin', () => {
    const activities = createOrganicFollowUpActivities(
      {
        id: 'lead-1',
        name: 'Ana',
        neighborhood: 'Ipanema',
        source: 'Orgânico | artigo: Investir em Ipanema | região: Ipanema',
      },
      new Date('2026-09-16T12:00:00.000Z'),
    );

    expect(activities).toHaveLength(3);
    expect(activities.map((activity) => activity.dueAt.toISOString())).toEqual([
      '2026-09-16T12:00:00.000Z',
      '2026-09-19T12:00:00.000Z',
      '2026-09-21T12:00:00.000Z',
    ]);
    expect(activities[0].type).toBe('TASK');
    expect(activities[0].note).toContain('Primeiro atendimento pendente');
    expect(activities[0].note).toContain('artigo: Investir em Ipanema');
    expect(activities[1].note).toContain('Mensagem sugerida (não enviada automaticamente)');
    expect(activities[1].note).toContain('curadoria objetiva');
    expect(activities[2].note).toContain('seleção breve de 2 ou 3 opções');
    expect(activities[1].note).not.toBe(activities[2].note);
  });
});
