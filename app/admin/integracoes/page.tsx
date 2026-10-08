import Link from 'next/link';

import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const periodDays = 28;

function configured(value: string | undefined) {
  return Boolean(value?.trim());
}

function dateLabel(date: Date | undefined, empty = 'Nenhum recebimento registrado') {
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
  const [googleCount, metaCount, googleLatest, metaLatest, digestCount, digestLatest] =
    await Promise.all([
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
    ]);

  const channels = [
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
