import { describe, expect, it } from 'vitest';

import { canAccessLead, leadAccessWhere, leadAssignmentWhere } from './lead-access';

describe('acesso aos leads da equipe', () => {
  const consultant = { id: 'broker-1', role: 'CONSULTANT' as const };

  it('limita corretores ao próprio responsável, inclusive em listas e exportações', () => {
    expect(leadAccessWhere(consultant)).toEqual({ assignedToId: consultant.id });
    expect(canAccessLead(consultant, 'broker-1')).toBe(true);
    expect(canAccessLead(consultant, 'broker-2')).toBe(false);
    expect(canAccessLead(consultant, null)).toBe(false);
  });

  it('permite à gestão visualizar inclusive leads ainda sem responsável', () => {
    for (const role of ['ADMIN', 'MANAGER'] as const) {
      expect(leadAccessWhere({ id: 'manager-1', role })).toEqual({});
      expect(canAccessLead({ id: 'manager-1', role }, null)).toBe(true);
    }
  });

  it('não amplia a visão de perfis editoriais ou somente leitura', () => {
    for (const role of ['EDITOR', 'MARKETING', 'VIEWER'] as const) {
      expect(leadAccessWhere({ id: 'other-1', role })).toEqual({ assignedToId: 'other-1' });
      expect(canAccessLead({ id: 'other-1', role }, 'broker-1')).toBe(false);
    }
  });

  it('filtra a fila de distribuição apenas para a gestão', () => {
    const manager = { id: 'manager-1', role: 'MANAGER' as const };
    expect(leadAssignmentWhere(manager, 'unassigned')).toEqual({ assignedToId: null });
    expect(leadAssignmentWhere(manager, 'assigned')).toEqual({ assignedToId: { not: null } });
    expect(leadAssignmentWhere(manager, 'invalid')).toEqual({});
    expect(leadAssignmentWhere(consultant, 'unassigned')).toEqual({});
  });
});
