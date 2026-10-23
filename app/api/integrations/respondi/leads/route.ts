import { createHash, timingSafeEqual } from 'node:crypto';

import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { parseRespondiLead, respondiFormId } from '@/lib/article-lead-integration';
import { respondiFieldsSchema } from '@/lib/respondi-landing';
import { createArticleLeadSource, resolveArticleNeighborhood } from '@/lib/article-origin';
import { resolveLeadAssignment } from '@/lib/lead-routing';
import { createOrganicFollowUpActivities } from '@/lib/lead-follow-up';
import { deliverLeadNotification, leadNotificationPending } from '@/lib/lead-notification';

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
  const formId = respondiFormId(payload);
  if (!formId)
    return NextResponse.json({ error: 'Resposta incompleta ou inválida.' }, { status: 422 });

  const catalog = await db.articleLeadIntegration.findUnique({
    where: { respondiFormId: formId },
    include: {
      article: { select: { slug: true, title: true, category: true, publishStatus: true } },
    },
  });
  // Article forms retain their existing publication gate. A landing mapping never
  // overrides an article's form ID, including when that article is unpublished.
  const landing = !catalog
    ? await db.respondiLandingIntegration.findUnique({ where: { formId } })
    : null;
  const fields = landing ? respondiFieldsSchema.safeParse(landing.fields) : null;
  if (
    (catalog && catalog.article.publishStatus !== 'PUBLISHED') ||
    (!catalog && (!landing?.enabled || !fields?.success))
  ) {
    return NextResponse.json({ error: 'Formulário sem associação ativa no CRM.' }, { status: 422 });
  }
  const details = parseRespondiLead(payload, fields?.success ? fields.data : undefined);
  if (!details)
    return NextResponse.json({ error: 'Resposta incompleta ou inválida.' }, { status: 422 });
  const externalId = `${details.formId}:${details.respondentId}`;
  const key = { provider_externalId: { provider, externalId } };
  if (await db.externalLeadReceipt.findUnique({ where: key, select: { id: true } })) {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  const neighborhood = catalog
    ? resolveArticleNeighborhood(catalog.article.category, catalog.article.title)
    : landing!.neighborhood;
  const articleSlug = catalog?.article.slug ?? null;
  const source = catalog
    ? createArticleLeadSource(catalog.article.title, neighborhood).slice(0, 120)
    : `Respondi | página: ${landing!.name}`.slice(0, 120);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const leadId = await db.$transaction(
        async (transaction) => {
          const { assignee, routingQueueId } = await resolveLeadAssignment(
            transaction,
            neighborhood,
          );
          const created = await transaction.lead.create({
            data: {
              name: details.name,
              phone: details.phone,
              email: details.email,
              neighborhood,
              articleSlug,
              source,
              message: details.message,
              utmSource: details.utmSource,
              utmMedium: details.utmMedium,
              utmCampaign: details.utmCampaign,
              consent: details.consent,
              assignedToId: assignee?.id || null,
              routingQueueId,
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
                articleSlug,
                pageUrl: landing?.pageUrl ?? null,
                assignedToId: assignee?.id || null,
              },
            },
          });
          await transaction.auditLog.create({ data: leadNotificationPending(created.id) });
          if (assignee)
            await transaction.user.update({
              where: { id: assignee.id },
              data: { lastLeadAssignedAt: created.createdAt },
            });
          return created.id;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      await deliverLeadNotification(leadId);
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
