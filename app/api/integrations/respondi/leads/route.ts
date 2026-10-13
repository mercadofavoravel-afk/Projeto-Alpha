import { createHash, timingSafeEqual } from 'node:crypto';

import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { parseRespondiLead } from '@/lib/article-lead-integration';
import { createArticleLeadSource, resolveArticleNeighborhood } from '@/lib/article-origin';
import { chooseAssignee, type DistributionCandidate } from '@/lib/lead-distribution';
import { createOrganicFollowUpActivities } from '@/lib/lead-follow-up';

const provider = 'RESPONDI';

function authorized(value: string, secret: string) {
  return timingSafeEqual(
    createHash('sha256').update(value).digest(),
    createHash('sha256').update(secret).digest(),
  );
}

export async function POST(request: Request) {
  const secret = process.env.RESPONDI_WEBHOOK_TOKEN;
  if (!secret || secret.length < 32 || secret.startsWith('replace-')) {
    return NextResponse.json({ error: 'Integração não configurada.' }, { status: 503 });
  }
  // Respondi documents a destination URL, without a signed payload. The private URL token
  // must be placed only in its webhook configuration, never in an article or client script.
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!authorized(token, secret))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ error: 'Conteúdo inválido.' }, { status: 415 });
  }
  if (Number(request.headers.get('content-length') || 0) > 64_000) {
    return NextResponse.json({ error: 'Conteúdo muito grande.' }, { status: 413 });
  }
  const raw = await request.text();
  if (raw.length > 64_000)
    return NextResponse.json({ error: 'Conteúdo muito grande.' }, { status: 413 });
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  const details = parseRespondiLead(payload);
  if (!details)
    return NextResponse.json({ error: 'Resposta incompleta ou inválida.' }, { status: 422 });

  const catalog = await db.articleLeadIntegration.findUnique({
    where: { respondiFormId: details.formId },
    include: {
      article: { select: { slug: true, title: true, category: true, publishStatus: true } },
    },
  });
  if (!catalog || catalog.article.publishStatus !== 'PUBLISHED') {
    return NextResponse.json(
      { error: 'Formulário não associado a artigo publicado.' },
      { status: 422 },
    );
  }
  const externalId = `${details.formId}:${details.respondentId}`;
  const key = { provider_externalId: { provider, externalId } };
  if (await db.externalLeadReceipt.findUnique({ where: key, select: { id: true } })) {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  const neighborhood = resolveArticleNeighborhood(catalog.article.category, catalog.article.title);
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
          const assignee = chooseAssignee(candidates, neighborhood);
          const created = await transaction.lead.create({
            data: {
              name: details.name,
              phone: details.phone,
              email: details.email,
              neighborhood,
              articleSlug: catalog.article.slug,
              source: createArticleLeadSource(catalog.article.title, neighborhood).slice(0, 120),
              message: details.message,
              utmSource: details.utmSource,
              utmMedium: details.utmMedium,
              utmCampaign: details.utmCampaign,
              consent: details.consent,
              assignedToId: assignee?.id || null,
            },
          });
          await transaction.externalLeadReceipt.create({
            data: { provider, externalId, leadId: created.id },
          });
          if (created.consent) {
            await transaction.leadActivity.createMany({
              data: createOrganicFollowUpActivities(created, created.createdAt),
            });
          } else {
            await transaction.leadActivity.create({
              data: {
                leadId: created.id,
                type: 'TASK',
                dueAt: created.createdAt,
                note: 'Verificar autorização de contato antes de iniciar mensagens automáticas.',
              },
            });
          }
          await transaction.auditLog.create({
            data: {
              action: 'lead.respondi_received',
              entityType: 'Lead',
              entityId: created.id,
              metadata: {
                formId: details.formId,
                articleSlug: catalog.article.slug,
                assignedToId: assignee?.id || null,
              },
            },
          });
          if (assignee)
            await transaction.user.update({
              where: { id: assignee.id },
              data: { lastLeadAssignedAt: created.createdAt },
            });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return NextResponse.json({ ok: true });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        if (await db.externalLeadReceipt.findUnique({ where: key, select: { id: true } })) {
          return NextResponse.json({ ok: true, duplicate: true });
        }
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034' &&
        attempt === 0
      )
        continue;
      return NextResponse.json({ error: 'Falha temporária.' }, { status: 503 });
    }
  }
  return NextResponse.json({ error: 'Falha temporária.' }, { status: 503 });
}
