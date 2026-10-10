import { describe, expect, it } from 'vitest';
import { matrixTeamWhere } from './team-access';

describe('visibilidade da equipe comercial', () => {
  it('limita o gerente a si e a corretores vinculados', () => {
    expect(matrixTeamWhere({ id: 'gerente-1', role: 'MANAGER' })).toEqual({
      AND: [
        { billingMode: 'INTERNAL' },
        {
          OR: [
            { id: 'gerente-1', role: 'MANAGER' },
            { managerId: 'gerente-1', role: 'CONSULTANT' },
          ],
        },
      ],
    });
  });

  it('mostra todos os profissionais comerciais à direção', () => {
    expect(matrixTeamWhere({ id: 'diretor-1', role: 'DIRECTOR' })).toEqual({
      billingMode: 'INTERNAL',
      role: { in: ['DIRECTOR', 'MANAGER', 'CONSULTANT'] },
    });
  });
});
