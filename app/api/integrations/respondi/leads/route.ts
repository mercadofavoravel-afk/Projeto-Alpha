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
    : `Respondi | página: ${l…2317 tokens truncated…00ednio. Sem esse pixel, o link pode abrir WhatsApp sem registrar origem. O webhook `lead_create` do Tintim pode ser configurado para CRM, mas requer amostra real do formato, autenticação e regra de reconciliação por telefone para impedir duplicatas entre formulário e conversa. Esse ingresso **ainda não está implementado**: conversa iniciada no Tintim não aparece automaticamente no CRM Alpha.

## Validação para ativação

Aplicar migração, publicar o código, associar URLs verificadas e testar leitura do formulário público, envio por webhook e presença de `articleSlug`, bairro, UTMs e consentimento na ficha do CRM. Conferir também o pixel e a origem de uma conversa no Tintim. A validação de envio real deve ser coordenada separadamente; não confundir cliques no botão, abertura de WhatsApp e lead recebido.

Referências do fornecedor consultadas em 13/10/2026: [payload Respondi](https://help.respondi.app/article/48-webhooks-payload-de-exemplo), [criação de formulário](https://help.respondi.app/article/42-como-criar-um-formulario), [URL pública Respondi](https://help.respondi.app/article/93-como-atualizar-o-endereco-do-meu-formulario-para-o-novo-padrao), [webhooks Tintim](https://tintim.app/base-de-conhecimento/como-funcionam-os-webhooks-do-tintim/) e [pixel e link rastreável](https://tintim.app/base-de-conhecimento/como-instalar-o-link-rastreavel-do-tintim-no-botao-flutuante-de-whatsapp/).
