import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUser: vi.fn(),
  findLead: vi.fn(),
  updateLead: vi.fn(),
  createActivity: vi.fn(),
  createAudit: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireApiPermission: mocks.auth }));
vi.mock('@/lib/db', () => ({
  db: {
    user: { findFirst: mocks.findUser },
    $transaction: async (callback: (transaction: unknown) => Promise<unknown>) =>
      callback({
        lead: { findFirst: mocks.findLead, update: mocks.updateLead },
        leadActivity: { create: mocks.createActivity },
        auditLog: { create: mocks.createAudit },
      }),
  },
}));

import { PATCH } from './route';

const managerId = 'cmssx3jda001dhy8jd0t3hpt8';
const consultantId = 'cmssx3jdl001ghy8j4z7keukq';

function request(assignedToId: string | null) {
  return new Request('http://localhost/api/admin/leads/lead-1/assignment', {
    method: 'PATCH',
    body: JSON.stringify({ assignedToId }),
  });
}

const context = { params: Promise.resolve({ id: 'lead-1' }) };

describe('atribuição de leads pelo gerente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ ok: true, user: { id: managerId, role: 'MANAGER' } });
    mocks.findUser.mockResolvedValue({ id: consultantId });
    mocks.findLead.mockResolvedValue({ id: 'lead-1', assignedToId: managerId });
  });

  it('não permite escolher um profissional fora da equipe', async () => {
    mocks.findUser.mockResolvedValue(null);
    const response = await PATCH(request(consultantId), context);

    expect(response.status).toBe(400);
    expect(mocks.findUser).toHaveBeenCalledWith({
      where: {
        AND: [
          expect.objectContaining({ OR: expect.any(Array) }),
          {
            id: consultantId,
            isActive: true,
            OR: [
              { id: managerId, role: 'MANAGER' },
              { role: 'CONSULTANT', managerId },
            ],
          },
        ],
      },
      select: { id: true },
    });
    expect(mocks.updateLead).not.toHaveBeenCalled();
  });

  it('não permite atribuir um lead fora da equipe nem devolvê-lo à fila global', async () => {
    expect((await PATCH(request(null), context)).status).toBe(403);

    mocks.findLead.mockResolvedValue(null);
    expect((await PATCH(request(consultantId), context)).status).toBe(404);
    expect(mocks.findLead).toHaveBeenCalledWith({
      where: {
        id: 'lead-1',
        OR: [{ assignedToId: managerId }, { assignedTo: { managerId } }],
      },
      select: { id: true, assignedToId: true },
    });
    expect(mocks.updateLead).not.toHaveBeenCalled();
  });

  it('permite transferir um lead visível para um corretor da equipe', async () => {
    const response = await PATCH(request(consultantId), context);

    expect(response.status).toBe(200);
    expect(mocks.updateLead).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { assignedToId: consultantId },
    });
    expect(mocks.createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: managerId, action: 'lead.assigned' }),
    });
  });
});
