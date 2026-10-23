import Link from 'next/link';
import React from 'react';

import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { leadNotificationHealth } from '@/lib/lead-notification';
import { SITE_CONFIG } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

const periodDays = 28;

function configured(value: string | undefined) {
  return Boolean(value?.trim());
}

function dateLabel(date: Date | null | undefined, empty = 'Nenhum recebimento registrado') {
  return date
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
      }).format(date)
    : empty;
}

export default async function IntegrationsPage() {
  await requirePermission('users:manage');

  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const [
    googleCount,
    metaCount,
    googleLatest,
    metaLatest,
    digestCount,
    digestLatest,
    respondiCount,
    respondiLatest,
    mappedForms,
    publishedArticles,
    notifications,
    queues,
    eligibleUsers,
    waitingForRoulette,
    unassignedOutsideRoulette,
  ] = await Promise.all([
    db.externalLeadReceipt.count({
      where: { provider: 'GOOGLE_ADS', createdAt: { gte: since } },
    }),
    db.externalLeadReceipt.count({
      where: { provider: 'META_LEAD_ADS', createdAt: { gte: since } },
    }),
    db.externalLeadReceipt.findFirst({
      where: { provider: 'GOOGLE_ADS' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    db.externalLeadReceipt.findFirst({
      where: { provider: 'META_LEAD_ADS' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    db.auditLog.count({
      where: { action: 'crm.daily_digest.sent', createdAt: { gte: since } },
    }),
    db.auditLog.findFirst({
      where: { action: 'crm.daily_digest.sent' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    db.externalLeadReceipt.count({
      where: { provider: 'RESPONDI', createdAt: { gte: since } },
    }),
    db.externalLeadReceipt.findFirst({
      where: { provider: 'RESPONDI' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    db.articleLeadIntegration.count({
      where: { respondiFormId: { not: null }, article: { publishStatus: 'PUBLISHED' } },
    }),
    db.article.count({ where: { publishStatus: 'PUBLISHED' } }),
    leadNotificationHealth(since),
    db.leadRouletteQueue.findMany({
      select: { id: true, name: true, enabled: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.user.count({
      where: {
        isActive: true,
        acceptsLeads: true,
        role: { in: ['DIRECTOR', 'MANAGER', 'CONSULTANT'] },
      },
    }),
    db.lead.count({
      where: {
        assignedToId: null,
        routingQueueId: { not: null },
        status: { notIn: ['WON', 'LOST'] },
      },
    }),
    db.lead.count({
      where: { assignedToId: null, routingQueueId: null, status: { notIn: ['WON', 'LOST'] } },
    }),
  ]);

  const channels = [
    {
      name: 'Respondi · artigos',
      configured: Boolean(
        process.env.RESPONDI_WEBHOOK_TOKEN &&
          process.env.RESPONDI_WEBHOOK_TOKEN.length >= 32 &&
          !process.env.RESPONDI_WEBHOOK_TOKEN.startsWith('replace-'),
      ),
      count: respondiCount,
      latest: respondiLatest?.createdAt,
      next: `${mappedForms} de ${publishedArticles} artigos publicados com formulário associado. Conferir o webhook no Respondi e um recebimento autorizado; o formulário próprio do Alpha funciona separadamente.`,
    },
    {
      name: 'Google Ads · formulário nativo',
      configured: configured(process.env.GOOGLE_ADS_LEAD_WEBHOOK_KEY),
      count: googleCount,
      latest: googleLatest?.createdAt,
      next: 'Cadastrar URL e chave do webhook no formulário da conta Google Ads e validar um contato real autorizado.',
    },
    {
      name: 'Meta · formulário instantâneo',
      configured: [
        process.env.META_LEAD_VERIFY_TOKEN,
        process.env.META_LEAD_APP_SECRET,
        process.env.META_LEAD_ACCESS_TOKEN,
        process.env.META_LEAD_PAGE_IDS,
        process.env.META_GRAPH_VERSION,
      ].every(configured),
      count: metaCount,
      latest: metaLatest?.createdAt,
      next: 'Conectar aplicativo e Página autorizados, assinar leadgen e validar um contato real autorizado.',
    },
  ];

  return (
    <>
      <div className="eyebrow">Captação · diagnóstico operacional</div>
      <h1>Integrações de leads</h1>
      <p>
        Configuração é verificada apenas pela presença das variáveis no servidor. Isso não comprova
        acesso à conta externa nem entrega de leads. O painel nunca exibe chaves ou tokens.
      </p>
      <div className="panel">
        <h2>Distribuição e pendências do CRM</h2>
        <p>
          {queues.filter((queue) => queue.enabled).length} fila(s) ativa(s) de {queues.length}{' '}
          configurada(s). {eligibleUsers} profissional(is) com recebimento habilitado. Isso não
          comprova presença online, check-in, disponibilidade por bairro ou capacidade livre.
        </p>
        {queues.length === 0 && (
          <p role="status">
            A roleta ainda não foi configurada. O sorteio exige uma fila de plantão; o recebimento
            atual segue as regras de distribuição existentes.
          </p>
        )}
        {queues.length > 0 && queues.every((queue) => !queue.enabled) && (
          <p role="status">
            Todas as filas estão pausadas. Os novos contatos dessas filas aguardam a gestão.
          </p>
        )}
        <p>
          {waitingForRoulette} cadastro(s) aguardando na roleta; {unassignedOutsideRoulette}{' '}
          cadastro(s) sem responsável fora da roleta. Cadastros antigos não são incluídos
          automaticamente no sorteio. Esses totais podem incluir testes e não representam clientes
          comprovados.
        </p>
        <p>
          <Link href="/admin/roleta">Configurar e acompanhar plantões</Link> ·{' '}
          <Link href="/admin/usuarios">Conferir corretores e bairros</Link> ·{' '}
          <Link href="/admin/leads">Revisar cadastros sem responsável</Link>
        </p>
      </div>
      <div className="panel">
        <h2>Avisos de novos leads</h2>
        <p>
          Destino da matriz: {SITE_CONFIG.email}.{' '}
          {configured(process.env.RESEND_API_KEY) && configured(process.env.EMAIL_FROM)
            ? 'Configuração de e-mail presente.'
            : 'Configuração de e-mail incompleta.'}
        </p>
        <p role={notifications.pending > 0 ? 'status' : undefined}>
          <strong>{notifications.pending} avisos aguardando envio.</strong>{' '}
          {notifications.pending > 0
            ? `Pendência mais antiga: ${dateLabel(notifications.oldestPendingAt)}.`
            : 'Não há avisos pendentes na fila registrada.'}
        </p>
        <p>
          {notifications.sent} envios aceitos pela API de e-mail nos últimos {periodDays} dias.
          Último registro: {dateLabel(notifications.latestSentAt, 'Nenhum envio registrado')}. O
          cadastro permanece no CRM se o aviso falhar. A rotina diária tenta recuperar os avisos
          pendentes; aceitação pela API não comprova entrega na caixa de entrada.
        </p>
        <p>
          Confira os cadastros em <Link href="/admin/leads">Leads</Link> e os contatos sem
          responsável na fila da gestão. Ausência de avisos pendentes não comprova que todos os
          formulários externos estejam conectados.
        </p>
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Canal</th>
                <th>Configuração no Alpha</th>
                <th>Recebimentos em 28 dias</th>
                <th>Último recebimento</th>
                <th>Para ativar e validar</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr key={channel.name}>
                  <td>{channel.name}</td>
                  <td>
                    {channel.configured
                      ? 'Variáveis presentes; conexão não validada'
                      : 'Variáveis ausentes'}
                  </td>
                  <td>{channel.count}</td>
                  <td>{dateLabel(channel.latest)}</td>
                  <td>{channel.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <Link href="/admin/integracoes/respondi">
            Configurar formulários Respondi das páginas comerciais
          </Link>
        </p>
      </div>
      <div className="panel">
        <h2>Avisos internos de atendimento</h2>
        <p>
          Resumo diário por e-mail:{' '}
          {configured(process.env.CRON_SECRET) &&
          configured(process.env.RESEND_API_KEY) &&
          configured(process.env.EMAIL_FROM)
            ? 'variáveis presentes; confira o primeiro envio na próxima execução'
            : 'configuração incompleta'}
          .
        </p>
        <p>
          {digestCount} envios aceitos pela API de e-mail nos últimos {periodDays} dias. Último
          registro: {dateLabel(digestLatest?.createdAt, 'Nenhum envio registrado')}. A aceitação
          pela API não comprova leitura nem entrega na caixa de entrada.
        </p>
        <p>
          O resumo é diário e complementa os alertas exibidos com o painel aberto. Para conferir as
          fichas e os prazos, abra a <Link href="/admin/agenda">agenda comercial</Link>.
        </p>
      </div>
      <p>
        Estes números são cadastros externos deduplicados, não visitas, cliques ou pessoas únicas.
        Formulários do próprio site seguem outro fluxo; consulte{' '}
        <Link href="/admin/origens">Origens e conversões</Link>.
      </p>
    </>
  );
}
