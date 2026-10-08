import Link from 'next/link';

import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const periodDays = 28;

function configured(value: string | undefined) {
  return Boolean(value?.trim());
}

function dateLabel(date: Date | undefined) {
  return date
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
      }).format(date)
    : 'Nenhum recebimento registrado';
}

export default async function IntegrationsPage() {
  await requirePermission('users:manage');

  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const [googleCount, metaCount, googleLatest, metaLatest] = await Promise.all([
    db.externalLeadReceipt.count({ where: { provider: 'GOOGLE_ADS', createdAt: { gte: since } } }),
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
      <p>
        Estes números são cadastros externos deduplicados, não visitas, cliques ou pessoas únicas.
        Formulários do próprio site seguem outro fluxo; consulte{' '}
        <Link href="/admin/origens">Origens e conversões</Link>.
      </p>
    </>
  );
}
