import { describe, expect, it } from 'vitest';
import { commercialTeamWhere } from './team-access';

describe('visibilidade da equipe comercial', () => {
  it('limita o gerente a si e a corretores vinculados', () => {
    expect(commercialTeamWhere({ id: 'gerente-1', role: 'MANAGER' })).toEqual({
      OR: [
        { id: 'gerente-1', role: 'MANAGER' },
        { managerId: 'gerente-1', role: 'CONSULTANT' },
      ],
    });
  });

  it('mostra todos os profissionais comerciais à direção', () => {
    expect(commercialTeamWhere({ id: 'diretor-1', role: 'DIRECTOR' })).toEqual({
      role: { in: ['DIRECTOR', 'MANAGER', 'CONSULTANT'] },
    });
  });
});
