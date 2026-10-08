import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findLead: vi.fn(),
  createActivity: vi.fn(),
  updateActivity: vi.fn(),
  updateLead: vi.fn(),
  createAudit: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireApiPermission: mocks.auth }));
vi.mock('@/lib/db', () => ({
  db: {
    $transaction: async (callback: (transaction: unknown) => Promise<unknown>) =>
      callback({
        lead: { findFirst: mocks.findLead, updateMany: mocks.updateLead },
        leadActivity: { create: mocks.createActivity, updateMany: mocks.updateActivity },
        auditLog: { create: mocks.createAudit },
      }),
  },
}));

import { POST } from './route';

const context = { params: Promise.resolve({ id: 'lead-1' }) };

function request(body: unknown) {
  return new Request('http://localhost/api/admin/leads/lead-1/activities', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('registro de acompanhamento no CRM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ ok: true, user: { id: 'corretor-1', role: 'CONSULTANT' } });
    mocks.findLead.mockResolvedValue({ id: 'lead-1' });
    mocks.createActivity.mockResolvedValue({ id: 'atividade-1' });
    mocks.updateLead.mockResolvedValue({ count: 1 });
  });

  it('confirma o primeiro atendimento apenas com contato realizado', async () => {
    const response = await POST(
      request({ type: 'CALL', note: 'Cliente atendido por telefone.' }),
      context,
    );

    expect(response.status).toBe(201);
    expect(mocks.createActivity).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'CALL', completedAt: expect.any(Date) }),
    });
    expect(mocks.updateLead).toHaveBeenCalledWith({
      where: { id: 'lead-1', status: 'NEW' },
      data: { status: 'CONTACTED' },
    });
    expect(mocks.updateActivity).toHaveBeenCalledWith({
      where: {
        leadId: 'lead-1',
        type: 'TASK',
        note: { startsWith: 'Primeiro atendimento pendente:' },
        completedAt: null,
      },
      data: { completedAt: expect.any(Date) },
    });
  });

  it('não trata um lembrete agendado como contato realizado', async () => {
    const response = await POST(
      request({ type: 'WHATSAPP', dueAt: '2026-10-09T12:00:00.000Z' }),
      context,
    );

    expect(response.status).toBe(201);
    expect(mocks.createActivity).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'WHATSAPP', completedAt: undefined }),
    });
    expect(mocks.updateLead).not.toHaveBeenCalled();
    expect(mocks.updateActivity).not.toHaveBeenCalled();
  });

  it('rejeita atividade fora dos leads do corretor', async () => {
    mocks.findLead.mockResolvedValue(null);
    const response = await POST(request({ type: 'NOTE', note: 'Sem acesso.' }), context);

    expect(response.status).toBe(404);
    expect(mocks.createActivity).not.toHaveBeenCalled();
  });
});
