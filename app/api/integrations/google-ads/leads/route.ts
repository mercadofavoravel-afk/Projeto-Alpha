import { createHash, timingSafeEqual } from 'node:crypto';

import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { chooseAssignee, type DistributionCandidate } from '@/lib/lead-distribution';
import { parseGoogleLeadForm } from '@/lib/google-lead-form';

function sameKey(actual: string, expected: string) {
  const actualHash = createHash('sha256').update(actual).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export async function POST(request: Request) {
  const expectedKey = process.env.GOOGLE_ADS_LEAD_WEBHOOK_KEY;
  if (!expectedKey || expectedKey.startsWith('replace-')) {
    return NextResponse.json({ message: 'Integração não configurada.' }, { status: 503 });
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ message: 'Conteúdo inválido.' }, { status: 415 });
  }
  if (Number(request.headers.get('content-length') || 0) > 64_000) {
    return NextResponse.json({ message: 'Conteúdo muito grande.' }, { status: 413 });
  }

  const raw = await request.text();
  if (raw.length > 64_000) {
    return NextResponse.json({ message: 'Conteúdo muito grande.' }, { status: 413 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ message: 'JSON inválido.' }, { status: 400 });
  }
  const lead = parseGoogleLeadForm(payload);
  if (!lead) return NextResponse.json({ message: 'Dados incompletos.' }, { status: 400 });
  if (!sameKey(lead.key, expectedKey)) {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
  }
  // The Google Ads form builder sends sample leads. A test must never enter the commercial queue.
  if (lead.isTest) return NextResponse.json({});

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await db.$transaction(
        async (transaction) => {
          const users = await transaction.user.findMany({
            where: {
              isActive: true,
              acceptsLeads: true,
              role: { in: ['DIRECTOR', 'MANAGER', 'CONSULTANT'] },
            },
            select: {
              id: true,
              leadCapacity: true,
              serviceRegions: true,
              lastLeadAssignedAt: true,
              _count: {
                select: { assignedLeads: { where: { status: { notIn: ['WON', 'LOST'] } } } },
              },
            },
          });
          const candidates: DistributionCandidate[] = users.map((user) => ({
            id: user.id,
            activeLeadCount: user._count.assignedLeads,
            leadCapacity: user.leadCapacity,
            serviceRegions: user.serviceRegions,
            lastLeadAssignedAt: user.lastLeadAssignedAt,
          }));
          const assignee = chooseAssignee(candidates, lead.neighborhood);
          const receivedAt = new Date();
          const created = await transaction.lead.create({
            data: {
              name: lead.name,
              phone: lead.phone,
              email: lead.email,
              neighborhood: lead.neighborhood,
              source: `Google Ads | formulário ${lead.formId || 'não informado'}`.slice(0, 120),
              utmSource: 'google',
              utmMedium: 'paid',
              utmCampaign: lead.campaignId,
              consent: false, // The webhook has no distinct privacy-consent field.
              assignedToId: assignee?.id || null,
            },
          });
          await transaction.externalLeadReceipt.create({
            data: { provider: 'GOOGLE_ADS', externalId: lead.externalId, leadId: created.id },
          });
          await transaction.leadActivity.create({
            data: {
              leadId: created.id,
              type: 'TASK',
              dueAt: receivedAt,
              note: 'Primeiro atendimento pendente: lead recebido de formulário do Google Ads.',
            },
          });
          await transaction.auditLog.create({
            data: {
              action: 'lead.google_ads_received',
              entityType: 'Lead',
              entityId: created.id,
              metadata: {
                formId: lead.formId,
                campaignId: lead.campaignId,
                assignedToId: assignee?.id,
              },
            },
          });
          if (assignee) {
            await transaction.user.update({
              where: { id: assignee.id },
              data: { lastLeadAssignedAt: receivedAt },
            });
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return NextResponse.json({});
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const receipt = await db.externalLeadReceipt.findUnique({
          where: { provider_externalId: { provider: 'GOOGLE_ADS', externalId: lead.externalId } },
          select: { id: true },
        });
        if (receipt) return NextResponse.json({});
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034' &&
        attempt === 0
      ) {
        continue;
      }
      return NextResponse.json({ message: 'Falha temporária. Tente novamente.' }, { status: 503 });
    }
  }
  return NextResponse.json({ message: 'Falha temporária. Tente novamente.' }, { status: 503 });
}
