import { createHmac } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({
  findReceipt: vi.fn(),
  findUsers: vi.fn(),
  createLead: vi.fn(),
  createReceipt: vi.fn(),
  createActivity: vi.fn(),
  createAudit: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    externalLeadReceipt: { findUnique: calls.findReceipt },
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        user: { findMany: calls.findUsers, update: calls.updateUser },
        lead: { create: calls.createLead },
        externalLeadReceipt: { create: calls.createReceipt },
        leadActivity: { create: calls.createActivity },
        auditLog: { create: calls.createAudit },
      }),
  },
}));

import { GET, POST } from './route';

const payload = {
  object: 'page',
  entry: [
    { id: '123', changes: [{ field: 'leadgen', value: { leadgen_id: '456', form_id: '789' } }] },
  ],
};

function notification(body: unknown, signed = true) {
  const raw = JSON.stringify(body);
  return new Request('https://example.com/api/integrations/meta/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': signed
        ? `sha256=${createHmac('sha256', 'app-secret').update(raw).digest('hex')}`
        : 'sha256=invalid',
    },
    body: raw,
  });
}

describe('Meta Lead Ads webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('META_LEAD_APP_SECRET', 'app-secret');
    vi.stubEnv('META_LEAD_VERIFY_TOKEN', 'verify-secret');
    vi.stubEnv('META_LEAD_ACCESS_TOKEN', 'page-access-token');
    vi.stubEnv('META_GRAPH_VERSION', 'v24.0');
    vi.stubEnv('META_LEAD_PAGE_IDS', '123');
    calls.findReceipt.mockResolvedValue(null);
    calls.findUsers.mockResolvedValue([]);
    calls.createLead.mockResolvedValue({ id: 'new-lead' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: '456',
            form_id: '789',
            field_data: [
              { name: 'full_name', values: ['Cliente Meta'] },
              { name: 'phone_number', values: ['21999998888'] },
            ],
          }),
          { status: 200 },
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('verifies the callback token and echoes the challenge', async () => {
    const url =
      'https://example.com/api/integrations/meta/leads?hub.mode=subscribe&hub.challenge=12345&hub.verify_token=verify-secret';
    const response = await GET(new Request(url));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('12345');
    expect((await GET(new Request(url.replace('verify-secret', 'wrong')))).status).toBe(403);
  });

  it('rejects unsigned and unauthorized page notifications before fetching private data', async () => {
    expect((await POST(notification(payload, false))).status).toBe(401);
    expect(
      (await POST(notification({ ...payload, entry: [{ ...payload.entry[0], id: '999' }] })))
        .status,
    ).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
    expect(calls.createLead).not.toHaveBeenCalled();
  });

  it('fetches the verified lead and stores it once in the management queue', async () => {
    expect((await POST(notification(payload))).status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({ hostname: 'graph.facebook.com', pathname: '/v24.0/456' }),
      expect.objectContaining({ headers: { Authorization: 'Bearer page-access-token' } }),
    );
    expect(calls.createLead).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Cliente Meta',
        utmSource: 'meta',
        assignedToId: null,
        consent: false,
      }),
    });
    expect(calls.createReceipt).toHaveBeenCalledWith({
      data: {
        provider: 'META_LEAD_ADS',
        externalId: '456',
        leadId: 'new-lead',
      },
    });
    expect(calls.createActivity).toHaveBeenCalled();
    calls.findReceipt.mockResolvedValueOnce({ id: 'existing' });
    expect((await POST(notification(payload))).status).toBe(200);
    expect(calls.createLead).toHaveBeenCalledTimes(1);
  });
});
