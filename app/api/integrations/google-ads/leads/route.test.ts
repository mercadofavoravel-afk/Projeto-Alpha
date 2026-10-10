import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({
  users: vi.fn(),
  createLead: vi.fn(),
  receipt: vi.fn(),
  activity: vi.fn(),
  audit: vi.fn(),
  updateUser: vi.fn(),
  personalConnection: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    marketingConnection: { findUnique: calls.personalConnection },
    $transaction: async (callback: (transaction: unknown) => Promise<unknown>) =>
      callback({
        user: { findMany: calls.users, update: calls.updateUser },
        lead: { create: calls.createLead },
        externalLeadReceipt: { create: calls.receipt },
        leadActivity: { create: calls.activity },
        auditLog: { create: calls.audit },
      }),
  },
}));

import { POST } from './route';

function request(key = 'configured-secret', isTest = false) {
  return new Request('http://localhost/api/integrations/google-ads/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_id: 'google-lead-001',
      google_key: key,
      is_test: isTest,
      campaign_id: 987,
      form_id: 123,
      user_column_data: [
        { column_id: 'FULL_NAME', string_value: 'Cliente Silva' },
        { column_id: 'PHONE_NUMBER', string_value: '+5521999999999' },
      ],
    }),
  });
}

describe('Google Ads lead form receiver', () => {
  const previousKey = process.env.GOOGLE_ADS_LEAD_WEBHOOK_KEY;
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_ADS_LEAD_WEBHOOK_KEY = 'configured-secret';
    calls.users.mockResolvedValue([
      {
        id: 'broker-1',
        leadCapacity: 30,
        serviceRegions: [],
        lastLeadAssignedAt: null,
        _count: { assignedLeads: 0 },
      },
    ]);
    calls.createLead.mockResolvedValue({ id: 'lead-1' });
    calls.personalConnection.mockResolvedValue(null);
  });
  afterEach(() => {
    if (previousKey === undefined) delete process.env.GOOGLE_ADS_LEAD_WEBHOOK_KEY;
    else process.env.GOOGLE_ADS_LEAD_WEBHOOK_KEY = previousKey;
  });

  it('refuses an invalid key and ignores the provider sample', async () => {
    expect((await POST(request('wrong'))).status).toBe(401);
    expect((await POST(request('configured-secret', true))).status).toBe(200);
    expect(calls.createLead).not.toHaveBeenCalled();
  });

  it('keeps campaign provenance, assigns an eligible professional and records a receipt', async () => {
    expect((await POST(request())).status).toBe(200);
    expect(calls.createLead).toHaveBeenCalledWith({
      data: expect.objectContaining({
        source: 'Google Ads | formulário 123',
        utmSource: 'google',
        utmCampaign: '987',
        assignedToId: 'broker-1',
        consent: false,
      }),
    });
    expect(calls.receipt).toHaveBeenCalledWith({
      data: {
        provider: 'GOOGLE_ADS',
        externalId: 'google-lead-001',
        leadId: 'lead-1',
      },
    });
    expect(calls.activity).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        type: 'TASK',
      }),
    });
  });

  it('routes an individually configured webhook only to its account owner', async () => {
    calls.personalConnection.mockResolvedValue({
      userId: 'broker-2',
      provider: 'google_ads',
      selectedAccountId: '1234567890',
    });
    calls.users.mockResolvedValue([
      {
        id: 'broker-1',
        leadCapacity: 30,
        serviceRegions: [],
        lastLeadAssignedAt: null,
        _count: { assignedLeads: 0 },
      },
      {
        id: 'broker-2',
        leadCapacity: 30,
        serviceRegions: [],
        lastLeadAssignedAt: null,
        _count: { assignedLeads: 0 },
      },
    ]);
    expect((await POST(request('personal-key'))).status).toBe(200);
    expect(calls.createLead).toHaveBeenCalledWith({
      data: expect.objectContaining({ assignedToId: 'broker-2' }),
    });
    expect(calls.audit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: expect.objectContaining({ accountId: '1234567890', ownerId: 'broker-2' }),
      }),
    });
  });

  it('never puts a personal lead in the global queue when its owner is unavailable', async () => {
    calls.personalConnection.mockResolvedValue({
      userId: 'broker-2',
      provider: 'google_ads',
      selectedAccountId: '1234567890',
    });
    expect((await POST(request('personal-key'))).status).toBe(503);
    expect(calls.createLead).not.toHaveBeenCalled();
  });
});
