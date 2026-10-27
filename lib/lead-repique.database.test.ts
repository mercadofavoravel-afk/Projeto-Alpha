import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const auth = vi.hoisted(() => ({ userId: '', allowed: true }));
vi.mock('@/lib/auth', () => ({
  requireApiPermission: vi.fn(async () =>
    auth.allowed
      ? { ok: true, user: { id: auth.userId, role: 'ADMIN' } }
      : { ok: false, status: 403, error: 'Sem permissão' },
  ),
}));
import { db } from './db';
import { processRepique } from './lead-repique';
import { POST as importContacts } from '@/app/api/admin/leads/import/route';
import { POST as changeCampaign } from '@/app/api/admin/leads/repique/route';

describe.runIf(process.env.REPIQUE_DATABASE_TESTS === '1')(
  'importação e repique em PostgreSQL local descartável',
  () => {
    const brokers: string[] = [];
    let campaignId = '';
    let leadIds: string[] = [];
    const payload = {
      batchId: randomUUID(),
      name: 'isolated-test-list',
      consent: false,
      rows: [
        { name: 'Teste isolado um', phone: '21999990001', neighborhood: 'Leblon' },
        { name: 'Teste isolado dois', phone: '21999990002', neighborhood: 'Leblon' },
        { name: 'Teste isolado três', phone: '21999990003', neighborhood: 'Leblon' },
      ],
      campaign: { brokerIds: brokers, intervalMinutes: 3, mode: 'ONE' },
    };
    const request = (body: unknown) =>
      new Request('http://localhost/alpha/api/admin/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

    beforeAll(async () => {
      const url = new URL(process.env.DATABASE_URL!);
      if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.includes('test'))
        throw new Error('Este teste exige um banco local descartável de testes.');
      const admin = await db.user.create({
        data: {
          email: 'isolated-admin@example.invalid',
          passwordHash: 'not-a-login-password',
          role: 'ADMIN',
          serviceRegions: [],
        },
      });
      auth.userId = admin.id;
      for (let i = 0; i < 2; i++) {
        const broker = await db.user.create({
          data: {
            email: `isolated-broker-${i}@example.invalid`,
            passwordHash: 'not-a-login-password',
            role: 'CONSULTANT',
            acceptsLeads: true,
            leadCapacity: 10,
            serviceRegions: ['Leblon'],
          },
        });
        brokers.push(broker.id);
      }
    });

    it('importa contatos, normaliza telefone e repete requisição sem duplicar', async () => {
      const response = await importContacts(request(payload));
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toMatchObject({ created: 3, reused: 0, queued: 3 });
      campaignId = result.campaignId;
      const campaign = await db.leadRepiqueCampaign.findUniqueOrThrow({
        where: { id: campaignId },
        include: { items: true },
      });
      expect(campaign.status).toBe('PAUSED');
      leadIds = campaign.items.map((item) => item.leadId);
      expect(
        (await db.lead.findFirstOrThrow({ where: { id: { in: leadIds } } })).phone.startsWith('55'),
      ).toBe(true);
      expect(await (await importContacts(request(payload))).json()).toEqual(result);
      expect(await db.lead.count({ where: { id: { in: leadIds } } })).toBe(3);
      expect(await db.leadRepiqueCampaign.count({ where: { id: campaignId } })).toBe(1);
    });

    it('respeita pausa, intervalo e rodada sem rajada ou entrega duplicada', async () => {
      expect((await processRepique()).delivered).toBe(0);
      expect((await changeCampaign(request({ id: campaignId, action: 'start' }))).status).toBe(200);
      const campaign = await db.leadRepiqueCampaign.findUniqueOrThrow({
        where: { id: campaignId },
      });
      const due = campaign.nextRunAt!;
      expect((await processRepique(new Date(due.getTime() - 1))).delivered).toBe(0);
      expect((await processRepique(due)).delivered).toBe(1);
      expect((await processRepique(due)).delivered).toBe(0);
      const first = await db.leadRepiqueItem.findFirstOrThrow({
        where: { campaignId, status: 'DELIVERED' },
      });
      expect(first.assignedToId).toBe(brokers[0]);
      expect((await processRepique(new Date(due.getTime() + 180000))).delivered).toBe(1);
      const recipients = await db.leadRepiqueItem.findMany({
        where: { campaignId, status: 'DELIVERED' },
      });
      expect(new Set(recipients.map((item) => item.assignedToId)).size).toBe(2);
      const pending = await db.leadRepiqueItem.findFirstOrThrow({
        where: { campaignId, status: 'PENDING' },
      });
      await db.lead.update({ where: { id: pending.leadId }, data: { status: 'CONTACTED' } });
      const end = await processRepique(new Date(due.getTime() + 360000));
      expect(end).toMatchObject({ delivered: 0, skipped: 1 });
      expect(
        (await db.leadRepiqueCampaign.findUniqueOrThrow({ where: { id: campaignId } })).status,
      ).toBe('COMPLETED');
      expect(
        await db.auditLog.count({
          where: { action: 'lead.repique_assigned', entityId: { in: leadIds } },
        }),
      ).toBe(2);
    });

    it('reutiliza contatos sem alterar consentimento nem dados existentes', async () => {
      const response = await importContacts(
        request({
          ...payload,
          batchId: randomUUID(),
          consent: true,
          campaign: undefined,
          rows: payload.rows.map((row) => ({ ...row, name: 'Não sobrescrever' })),
        }),
      );
      expect(await response.json()).toMatchObject({ created: 0, reused: 3, queued: 0 });
      const leads = await db.lead.findMany({ where: { id: { in: leadIds } } });
      expect(leads.every((lead) => !lead.consent && lead.name !== 'Não sobrescrever')).toBe(true);
    });

    it('bloqueia importação sem permissão antes de gravar qualquer contato', async () => {
      auth.allowed = false;
      expect((await importContacts(request(payload))).status).toBe(403);
      expect(await db.lead.count({ where: { id: { in: leadIds } } })).toBe(3);
      auth.allowed = true;
    });

    it('serializa dois pulsos simultâneos e entrega uma rodada sem duplicar', async () => {
      const response = await importContacts(
        request({
          ...payload,
          batchId: randomUUID(),
          name: 'isolated-round-list',
          rows: [
            { name: 'Rodada isolada um', phone: '21999990011', neighborhood: 'Leblon' },
            { name: 'Rodada isolada dois', phone: '21999990012', neighborhood: 'Leblon' },
            { name: 'Rodada isolada três', phone: '21999990013', neighborhood: 'Leblon' },
          ],
          campaign: { brokerIds: brokers, intervalMinutes: 30, mode: 'ROUND' },
        }),
      );
      expect(response.status).toBe(200);
      const { campaignId: roundId } = await response.json();
      await changeCampaign(request({ id: roundId, action: 'start' }));
      const campaign = await db.leadRepiqueCampaign.findUniqueOrThrow({ where: { id: roundId } });
      const due = campaign.nextRunAt!;
      const results = await Promise.all([processRepique(due), processRepique(due)]);
      expect(results.reduce((total, result) => total + result.delivered, 0)).toBe(2);
      const items = await db.leadRepiqueItem.findMany({
        where: { campaignId: roundId, status: 'DELIVERED' },
      });
      expect(items).toHaveLength(2);
      expect(new Set(items.map((item) => item.assignedToId)).size).toBe(2);
      const next = await db.leadRepiqueCampaign.findUniqueOrThrow({ where: { id: roundId } });
      expect(next.nextRunAt?.getTime()).toBe(due.getTime() + 30 * 60000);
      await changeCampaign(request({ id: roundId, action: 'pause' }));
      expect((await processRepique(new Date(due.getTime() + 60 * 60000))).delivered).toBe(0);
    });

    afterAll(async () => db.$disconnect());
  },
);
