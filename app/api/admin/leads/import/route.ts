import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { importedLeadSchema, normalizePhone } from '@/lib/lead-import';
import { lockRouting } from '@/lib/lead-routing';

const schema = z.object({
  batchId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  rows: z.array(importedLeadSchema).min(1).max(2000),
  consent: z.boolean().default(false),
  campaign: z
    .object({
      brokerIds: z.array(z.string().cuid()).min(1).max(50),
      intervalMinutes: z.number().int().min(1).max(1440),
      mode: z.enum(['ONE', 'ROUND']),
    })
    .optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiPermission('crm:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Confira os dados antes de importar.' }, { status: 400 });
  const input = parsed.data;
  try {
    const result = await db.$transaction(
      async (tx) => {
        await lockRouting(tx);
        const receiptId = `lead-import:${auth.user.id}:${input.batchId}`;
        const receipt = await tx.auditLog.findUnique({ where: { id: receiptId } });
        if (receipt) return receipt.metadata;
        const brokerIds = [...new Set(input.campaign?.brokerIds || [])];
        if (input.campaign) {
          const count = await tx.user.count({
            where: {
              id: { in: brokerIds },
              isActive: true,
              acceptsLeads: true,
              role: { in: ['DIRECTOR', 'MANAGER', 'CONSULTANT'] },
            },
          });
          if (count !== brokerIds.length)
            throw new Error('Selecione somente profissionais ativos que recebem leads.');
        }
        const contacts = await tx.lead.findMany({ select: { id: true, phone: true, email: true } });
        const phones = new Map<string, Set<string>>(),
          emails = new Map<string, Set<string>>();
        function index(map: Map<string, Set<string>>, key: string, id: string) {
          const ids = map.get(key) || new Set<string>();
          ids.add(id);
          map.set(key, ids);
        }
        for (const c of contacts) {
          index(phones, normalizePhone(c.phone), c.id);
          if (c.email) index(emails, c.email.trim().toLowerCase(), c.id);
        }
        let created = 0,
          reused = 0,
          ambiguous = 0;
        const leadIds = new Set<string>();
        for (const row of input.rows) {
          const ids = new Set([
            ...(phones.get(row.phone) || []),
            ...(row.email ? emails.get(row.email) || [] : []),
          ]);
          if (ids.size > 1) {
            ambiguous++;
            continue;
          }
          if (ids.size === 1) {
            reused++;
            leadIds.add([...ids][0]);
            continue;
          }
          const lead = await tx.lead.create({
            data: {
              ...row,
              consent: input.consent,
              source: `manual:${input.name}`.slice(0, 120),
              utmCampaign: input.name,
            },
          });
          index(phones, row.phone, lead.id);
          if (row.email) index(emails, row.email, lead.id);
          leadIds.add(lead.id);
          created++;
          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              type: 'NOTE',
              note: `Cadastro manual/importação: ${input.name}.`,
            },
          });
        }
        let campaignId: string | null = null,
          queued = 0;
        if (input.campaign) {
          const leads = await tx.lead.findMany({
            where: { id: { in: [...leadIds] }, status: { notIn: ['WON', 'LOST'] } },
            select: { id: true, assignedToId: true, updatedAt: true },
          });
          if (leads.length) {
            const campaign = await tx.leadRepiqueCampaign.create({
              data: {
                name: input.name,
                brokerIds,
                intervalMinutes: input.campaign.intervalMinutes,
                mode: input.campaign.mode,
                createdById: auth.user.id,
                items: {
                  create: leads.map((l) => ({
                    leadId: l.id,
                    expectedAssignedToId: l.assignedToId,
                    expectedUpdatedAt: l.updatedAt,
                  })),
                },
              },
            });
            campaignId = campaign.id;
            queued = leads.length;
          }
        }
        const summary = {
          created,
          reused,
          ambiguous,
          queued,
          campaignId,
          excludedFromQueue: leadIds.size - queued,
        };
        await tx.auditLog.create({
          data: {
            id: receiptId,
            action: 'lead.imported',
            entityType: 'LeadImport',
            userId: auth.user.id,
            metadata: summary,
          },
        });
        return summary;
      },
      { timeout: 60_000 },
    );
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao importar.' },
      { status: 400 },
    );
  }
}
