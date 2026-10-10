import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { chooseAssignee, type DistributionCandidate } from '@/lib/lead-distribution';
import { parseMetaLeadDetail, parseMetaNotifications } from '@/lib/meta-lead-form';
import { decryptMarketingToken } from '@/lib/marketing-oauth';
import { isCommercialCustomer } from '@/lib/commercial-subscription';
import { storeCustomerExternalLead } from '@/lib/customer-external-lead';

const provider = 'META_LEAD_ADS';

function equals(actual: string, expected: string) {
  const left = createHash('sha256').update(actual).digest();
  const right = createHash('sha256').update(expected).digest();
  return timingSafeEqual(left, right);
}

function config() {
  const appSecret = process.env.META_LEAD_APP_SECRET;
  const verifyToken = process.env.META_LEAD_VERIFY_TOKEN;
  const graphVersion = process.env.META_GRAPH_VERSION;
  const pageIds = (process.env.META_LEAD_PAGE_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  if (
    !appSecret ||
    !verifyToken ||
    [appSecret, verifyToken].some((value) => value.startsWith('replace-')) ||
    !graphVersion?.match(/^v\d+\.\d+$/) ||
    pageIds.some((id) => !/^\d{1,40}$/.test(id))
  )
    return null;
  return { appSecret, verifyToken, graphVersion, pageIds };
}

export async function GET(request: Request) {
  const verifyToken = process.env.META_LEAD_VERIFY_TOKEN;
  if (!verifyToken || verifyToken.startsWith('replace-'))
    return new Response('Integração não configurada.', { status: 503 });
  const params = new URL(request.url).searchParams;
  const challenge = params.get('hub.challenge') || '';
  if (
    params.get('hub.mode') !== 'subscribe' ||
    !challenge ||
    challenge.length > 200 ||
    !equals(params.get('hub.verify_token') || '', verifyToken)
  )
    return new Response('Não autorizado.', { status: 403 });
  return new Response(challenge, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

async function receiveLead(
  notification: { externalId: string; pageId: string; formId: string | null },
  settings: {
    accessToken: string;
    graphVersion: string;
    ownerId: string | null;
    commercialSiteId?: string | null;
  },
) {
  const key = { provider_externalId: { provider, externalId: notification.externalId } };
  if (
    !settings.commercialSiteId &&
    (await db.externalLeadReceipt.findUnique({ where: key, select: { id: true } }))
  )
    return true;

  const url = new URL(
    `https://graph.facebook.com/${settings.graphVersion}/${notification.externalId}`,
  );
  url.searchParams.set('fields', 'id,field_data,form_id');
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${settings.accessToken}` },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
  } catch {
    return false;
  }
  if (!response.ok) return false;
  const details = parseMetaLeadDetail(
    await response.json().catch(() => null),
    notification.externalId,
  );
  if (!details) return false;

  if (settings.commercialSiteId && settings.ownerId)
    return storeCustomerExternalLead({
      siteId: settings.commercialSiteId,
      ownerId: settings.ownerId,
      provider: 'META_LEAD_ADS',
      externalId: notification.externalId,
      name: details.name,
      phone: details.phone,
      email: details.email,
      source: `Meta Lead Ads | formulário ${details.formId || notification.formId || 'não informado'}`,
      utmSource: 'meta',
    });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await db.$transaction(
        async (transaction) => {
          const users = await transaction.user.findMany({
            where: {
              isActive: true,
              acceptsLeads: true,
              role: { in: ['DIRECTOR', 'MANAGER', 'CONSULTANT'] },
              billingMode: 'INTERNAL',
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
          const assignee = settings.ownerId
            ? candidates.find((candidate) => candidate.id === settings.ownerId) || null
            : chooseAssignee(candidates, details.neighborhood);
          // Never place another customer's lead in the central unassigned queue.
          if (settings.ownerId && !assignee)
            throw new Error('Responsável individual indisponível.');
          const now = new Date();
          const created = await transaction.lead.create({
            data: {
              name: details.name,
              phone: details.phone,
              email: details.email,
              neighborhood: details.neighborhood,
              source:
                `Meta Lead Ads | formulário ${details.formId || notification.formId || 'não informado'}`.slice(
                  0,
                  120,
                ),
              utmSource: 'meta',
              utmMedium: 'paid',
              consent: false,
              assignedToId: assignee?.id || null,
            },
          });
          await transaction.externalLeadReceipt.create({
            data: { provider, externalId: notification.externalId, leadId: created.id },
          });
          await transaction.leadActivity.create({
            data: {
              leadId: created.id,
              type: 'TASK',
              dueAt: now,
              note: 'Primeiro atendimento pendente: lead recebido de formulário instantâneo da Meta.',
            },
          });
          await transaction.auditLog.create({
            data: {
              action: 'lead.meta_received',
              entityType: 'Lead',
              entityId: created.id,
              metadata: {
                pageId: notification.pageId,
                formId: details.formId || notification.formId,
                assignedToId: assignee?.id || null,
                ownerId: settings.ownerId,
              },
            },
          });
          if (assignee)
            await transaction.user.update({
              where: { id: assignee.id },
              data: { lastLeadAssignedAt: now },
            });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const receipt = await db.externalLeadReceipt.findUnique({
          where: key,
          select: { id: true },
        });
        if (receipt) return true;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034' &&
        attempt === 0
      )
        continue;
      return false;
    }
  }
  return false;
}

export async function POST(request: Request) {
  const settings = config();
  if (!settings)
    return NextResponse.json({ message: 'Integração não configurada.' }, { status: 503 });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return NextResponse.json({ message: 'Conteúdo inválido.' }, { status: 415 });
  if (Number(request.headers.get('content-length') || 0) > 64_000)
    return NextResponse.json({ message: 'Conteúdo muito grande.' }, { status: 413 });
  const raw = await request.text();
  if (raw.length > 64_000)
    return NextResponse.json({ message: 'Conteúdo muito grande.' }, { status: 413 });
  const signature = request.headers.get('x-hub-signature-256') || '';
  const expected = `sha256=${createHmac('sha256', settings.appSecret).update(raw).digest('hex')}`;
  if (!equals(signature, expected))
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ message: 'JSON inválido.' }, { status: 400 });
  }
  const notifications = parseMetaNotifications(payload);
  if (!notifications) return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 });
  for (const notification of notifications) {
    if (notification.isTest) continue;
    const personal = await db.marketingConnection.findUnique({
      where: {
        provider_selectedAccountId: { provider: 'meta', selectedAccountId: notification.pageId },
      },
      select: {
        userId: true,
        selectedTokenEncrypted: true,
        leadSiteId: true,
        user: { select: { billingMode: true, isPlatformOwner: true } },
      },
    });
    const legacy = settings.pageIds.includes(notification.pageId)
      ? process.env.META_LEAD_ACCESS_TOKEN
      : null;
    if (!personal && !legacy)
      return NextResponse.json({ message: 'Página não autorizada.' }, { status: 403 });
    if (personal && !personal.user)
      return NextResponse.json({ message: 'Titular indisponível.' }, { status: 503 });
    if (personal?.user && isCommercialCustomer(personal.user) && !personal.leadSiteId)
      return NextResponse.json({ message: 'Site destinatário indisponível.' }, { status: 503 });
    let accessToken: string;
    try {
      accessToken = personal?.selectedTokenEncrypted
        ? decryptMarketingToken(personal.selectedTokenEncrypted)
        : legacy || '';
    } catch {
      return NextResponse.json({ message: 'Falha temporária. Tente novamente.' }, { status: 503 });
    }
    if (
      !accessToken ||
      !(await receiveLead(notification, {
        accessToken,
        graphVersion: settings.graphVersion,
        ownerId: personal?.userId || null,
        commercialSiteId:
          personal?.user && isCommercialCustomer(personal.user) ? personal.leadSiteId : null,
      }))
    )
      return NextResponse.json({ message: 'Falha temporária. Tente novamente.' }, { status: 503 });
  }
  return NextResponse.json({});
}
