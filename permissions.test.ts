import { describe, expect, it } from 'vitest';
import { hasPermission } from './permissions';
describe('RBAC', () => {
  it('permite gestão de usuários apenas ao administrador', () => {
    expect(hasPermission('ADMIN', 'users:manage')).toBe(true);
    expect(hasPermission('EDITOR', 'users:manage')).toBe(false);
  });
  it('permite CRM ao consultor', () => {
    expect(hasPermission('CONSULTANT', 'crm:write')).toBe(true);
  });
  it('mantém viewer somente leitura', () => {
    expect(hasPermission('VIEWER', 'catalog:write')).toBe(false);
    expect(hasPermission('VIEWER', 'analytics:read')).toBe(true);
  });
});
