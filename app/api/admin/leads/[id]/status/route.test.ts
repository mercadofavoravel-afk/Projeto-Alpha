import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findLead: vi.fn(),
  updateLead: vi.fn(),
  completeActivities: vi.fn(),
  createActivity: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireApiPermission: mocks.auth }));
vi.mock('@/lib/db', () => ({
  db: {
    lead: { findFirst: mocks.findLead },
    $transaction: async (callback: (transaction: unknown) => Promise<unknown>) =>
      callback({
        lead: { updateMany: mocks.updateLead },
        leadActivity: { updateMany: mocks.completeActivities, create: mocks.createActivity },
      }),
  },
}));

import { PATCH } from './route';

describe('CRM status update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ ok: true, user: { id: 'corretor-1', role: 'CONSULTANT' } });
    mocks.findLead.mockResolvedValue({ id: 'lead-1' });
    mocks.updateLead.mockResolvedValue({ count: 1 });
    mocks.completeActivities.mockResolvedValue({ count: 3 });
    mocks.createActivity.mockResolvedValue({ id: 'nota-1' });
  });

  it('closes first-contact and scheduled follow-up tasks after the lead is contacted', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/admin/leads/lead-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CONTACTED' }),
      }),
      { params: Promise.resolve({ id: 'lead-1' }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.completeActivities).toHaveBeenCalledWith({
      where: {
        leadId: 'lead-1',
        completedAt: null,
        OR: [
          { type: 'WHATSAPP', dueAt: { not: null } },
          { type: 'TASK', note: { startsWith: 'Primeiro atendimento pendente:' } },
        ],
      },
      data: { completedAt: expect.any(Date) },
    });
    expect(mocks.createActivity).toHaveBeenCalledWith({
      data: expect.objectContaining({ leadId: 'lead-1', type: 'NOTE' }),
    });
  });
});
