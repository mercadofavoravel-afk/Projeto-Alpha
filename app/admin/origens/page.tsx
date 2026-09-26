import Link from 'next/link';

import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { leadAccessWhere } from '@/lib/lead-access';
import { organicContentFromSource } from '@/lib/lead-origin';

export const dynamic = 'force-dynamic';

type LeadOrigin = {
  source: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  neighborhood: string | null;
};

function topCounts(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = value?.trim();
    if (label) counts.set(label, (counts.get(label) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .slice(0, 10);
}

function Summary({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  return (
    <section className="admin-card">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p>Ainda não há dados com origem identificada neste período.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Origem</th>
                <th>Leads</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, count]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function OrigensPage() {
  const user = await requirePermission('crm:reports');
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const leads: LeadOrigin[] = await db.lead.findMany({
    where: { ...leadAccessWhere(user), createdAt: { gte: since } },
    select: {
      source: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      neighborhood: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const platforms = topCounts(
    leads.map((lead) => {
      const platform = lead.utmSource?.trim().toLowerCase();
      const medium = lead.utmMedium?.trim().toLowerCase();
      return platform ? `${platform} / ${medium || 'meio não informado'}` : null;
    }),
  );
  const articles = topCounts(leads.map((lead) => organicContentFromSource(lead.source)));
  const campaigns = topCounts(leads.map((lead) => lead.utmCampaign));
  const regions = topCounts(leads.map((lead) => lead.neighborhood));
  const identified = leads.filter((lead) => Boolean(lead.utmSource?.trim())).length;
  const contentLeads = leads.filter((lead) =>
    Boolean(organicContentFromSource(lead.source)),
  ).length;

  return (
    <>
      <div className="eyebrow">CRM · últimos 90 dias</div>
      <h1>Origens e conversões</h1>
      <p>
        Origem registrada no cadastro, campanha, artigo e região. As contagens abaixo representam
        leads recebidos, não visitas nem impressões nos buscadores.
      </p>

      <div className="kpis">
        <div className="kpi">
          <b>{leads.length}</b>Leads no período
        </div>
        <div className="kpi">
          <b>{identified}</b>Com plataforma identificada
        </div>
        <div className="kpi">
          <b>{leads.length - identified}</b>Sem plataforma identificada
        </div>
        <div className="kpi">
          <b>{contentLeads}</b>De conteúdos identificados
        </div>
      </div>

      {leads.length === 5000 && (
        <p>Este painel mostra os 5.000 cadastros mais recentes dos últimos 90 dias.</p>
      )}

      <Summary title="Plataformas e meios identificados" rows={platforms} />
      <Summary title="Artigos que originaram cadastros" rows={articles} />
      <Summary title="Campanhas identificadas" rows={campaigns} />
      <Summary title="Regiões de interesse" rows={regions} />

      <section className="admin-card">
        <h2>Como ler estes números</h2>
        <p>
          A origem vem primeiro dos parâmetros UTM do link; quando eles não existem, o navegador
          pode informar o site referenciador. Algumas redes e aplicativos não enviam esse dado:
          nesses casos, a origem permanece sem identificação. Google Imagens, Google Maps e Busca
          podem compartilhar referências, então só distinguimos Maps quando o endereço de origem
          identifica Maps. Para mostrar visitas, pesquisas, impressões e cliques, ainda é preciso
          integrar dados do GA4 e do Google Search Console.
        </p>
        <Link href="/admin/leads">Abrir leads no CRM</Link>
      </section>
    </>
  );
}
