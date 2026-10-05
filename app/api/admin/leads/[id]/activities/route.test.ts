import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findLead: vi.fn(),
  createActivity: vi.fn(),
  audit: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireApiPermission: mocks.auth }));
vi.mock('@/lib/db', () => ({
  db: { lead: { findFirst: mocks.findLead }, leadActivity: { create: mocks.createActivity } },
}));
vi.mock('@/lib/audit', () => ({ audit: mocks.audit }));

import { POST } from './route';

function request(type: string, dueAt?: string) {
  return new Request('http://localhost/api/admin/leads/lead-1/activities', {
    method: 'POST',
    body: JSON.stringify({ type, note: 'Contato registrado', dueAt }),
  });
}

const context = { params: Promise.resolve({ id: 'lead-1' }) };

describe('registro de atividade do CRM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ ok: true, user: { id: 'corretor-1', role: 'CONSULTANT' } });
    mocks.findLead.mockResolvedValue({ id: 'lead-1' });
    mocks.createActivity.mockResolvedValue({ id: 'atividade-1' });
  });

  it('registra uma ligação feita como ação concluída', async () => {
    const response = await POST(request('CALL'), context);
    expect(response.status).toBe(201);
    expect(mocks.createActivity).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'CALL', completedAt: expect.any(Date) }),
    });
  });

  it('mantém uma mensagem agendada como tarefa pendente', async () => {
    const response = await POST(request('WHATSAPP', '2026-10-07T14:00:00.000Z'), context);
    expect(response.status).toBe(201);
    expect(mocks.createActivity).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'WHATSAPP',
        dueAt: new Date('2026-10-07T14:00:00.000Z'),
        completedAt: undefined,
      }),
    });
  });
});
