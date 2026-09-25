import { describe, expect, it } from 'vitest';

import { canManageEmployeeRole } from './team-roles';

describe('gestão da equipe', () => {
  it('permite ao diretor cadastrar e alterar gerentes e corretores', () => {
    expect(canManageEmployeeRole('DIRECTOR', 'MANAGER')).toBe(true);
    expect(canManageEmployeeRole('DIRECTOR', 'CONSULTANT')).toBe(true);
  });

  it('impede que o diretor gerencie administradores, diretores ou conteúdo por meio de usuários', () => {
    for (const role of ['ADMIN', 'DIRECTOR', 'EDITOR', 'MARKETING', 'VIEWER'] as const) {
      expect(canManageEmployeeRole('DIRECTOR', role)).toBe(false);
    }
    expect(canManageEmployeeRole('MANAGER', 'CONSULTANT')).toBe(false);
    expect(canManageEmployeeRole('ADMIN', 'DIRECTOR')).toBe(true);
  });
});
