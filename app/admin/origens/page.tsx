import Link from 'next/link';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { leadAccessWhere } from '@/lib/lead-access';
import { summarizeArticleLeads } from '@/lib/article-lead-summary';
import { contentFromSource } from '@/lib/lead-origin';

export const dynamic = 'force-dynamic';

type ArticleViewCount = {
  path: string;
  source: string;
  referrerPath: string | null;
  views: number;
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

  const [leads, articles, articleViews] = await Promise.all([
    db.lead.findMany({
      where: { ...leadAccessWhere(user), createdAt: { gte: since } },
      select: {
        articleSlug: true,
        source: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        neighborhood: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    }),
    db.article.findMany({
      where: { publishStatus: 'PUBLISHED' },
      select: { slug: true, title: true },
    }),
    db.$queryRaw<ArticleViewCount[]>(Prisma.sql`
      SELECT "path", COALESCE(NULLIF(LOWER(TRIM(metadata->>'utmSource')), ''), 'não identificada') AS source,
        NULLIF(metadata->>'referrerPath', '') AS "referrerPath",
        COUNT(*)::int AS views
      FROM "AnalyticsEvent"
      WHERE name = 'article_view' AND "createdAt" >= ${since} AND "path" IS NOT NULL
      GROUP BY "path", source, "referrerPath"
    `),
  ]);

  const platforms = topCounts(
    leads.map((lead) => {
      const platform = lead.utmSource?.trim().toLowerCase();
      const medium = lead.utmMedium?.trim().toLowerCase();
      return platform ? `${platform} / ${medium || 'meio não informado'}` : null;
    }),
  );
  const articleLeads = summarizeArticleLeads(leads);
  const publishedBySlug = new Map(articles.map((article) => [article.slug, article.title]));
  const leadsBySlug = new Map<string, number>(
    articleLeads.flatMap((row) => (row.slug ? [[row.slug, row.count] as const] : [])),
  );
  const viewsBySlug = new Map<
    string,
    { views: number; sources: Map<string, number>; previousPages: Map<string, number> }
  >();
  for (const row of articleViews) {
    const slug = /^\/(?:alpha\/)?artigos\/([a-z0-9-]+)\/?$/.exec(row.path)?.[1];
    if (!slug || !publishedBySlug.has(slug)) continue;
    const current = viewsBySlug.get(slug) || {
      views: 0,
      sources: new Map<string, number>(),
      previousPages: new Map<string, number>(),
    };
    current.views += row.views;
    current.sources.set(row.source, (current.sources.get(row.source) || 0) + row.views);
    if (row.referrerPath?.startsWith('/') && !row.referrerPath.startsWith('//')) {
      current.previousPages.set(
        row.referrerPath,
        (current.previousPages.get(row.referrerPath) || 0) + row.views,
      );
    }
    viewsBySlug.set(slug, current);
  }
  const articleRows = articles.sort(
    (a, b) =>
      (viewsBySlug.get(b.slug)?.views || 0) - (viewsBySlug.get(a.slug)?.views || 0) ||
      a.title.localeCompare(b.title, 'pt-BR'),
  );
  const campaigns = topCounts(leads.map((lead) => lead.utmCampaign));
  const regions = topCounts(leads.map((lead) => lead.neighborhood));
  const identified = leads.filter((lead) => Boolean(lead.utmSource?.trim())).length;
  const contentLeads = leads.filter(
    (lead) => Boolean(lead.articleSlug) || Boolean(contentFromSource(lead.source)),
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
      <section className="admin-card">
        <h2>Visitas por artigo</h2>
        <p>
          A partir da ativação do rastreamento, contamos carregamentos de cada página de artigo.
          Reaberturas da mesma página contam novamente; estes números não representam pessoas
          únicas. A plataforma vem de UTM ou site referenciador quando o navegador os informa. A
          página de referência registra apenas o caminho informado pelo navegador neste domínio.
          Ela pode continuar a mesma durante a navegação entre artigos e não comprova a plataforma
          de busca que trouxe o visitante.
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Artigo publicado</th>
                <th>Visualizações</th>
                <th>Plataforma das visualizações</th>
                <th>Página de referência no domínio</th>
                <th>Leads</th>
              </tr>
            </thead>
            <tbody>
              {articleRows.map((article) => {
                const result = viewsBySlug.get(article.slug);
                const sources = [...(result?.sources || new Map<string, number>())].sort(
                  (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'),
                );
                const previousPages = [
                  ...(result?.previousPages || new Map<string, number>()),
                ].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));
                return (
                  <tr key={article.slug}>
                    <td>
                      <Link href={`/artigos/${article.slug}`}>{article.title}</Link>
                    </td>
                    <td>{result?.views || 0}</td>
                    <td>
                      {sources.length === 0 ? (
                        'Sem dados'
                      ) : (
                        <details>
                          <summary>{`${sources[0][0]} (${sources[0][1]})`}</summary>
                          <ul>
                            {sources.map(([source, count]) => (
                              <li key={source}>{`${source}: ${count}`}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                    <td>
                      {previousPages.length === 0 ? (
                        'Não informada'
                      ) : (
                        <details>
                          <summary>{`${previousPages[0][0]} (${previousPages[0][1]})`}</summary>
                          <ul>
                            {previousPages.map(([path, count]) => (
                              <li key={path}>{`${path}: ${count}`}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                    <td>{leadsBySlug.get(article.slug) || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="admin-card">
        <h2>Artigos que originaram cadastros</h2>
        {articleLeads.length === 0 ? (
          <p>Ainda não há cadastros atribuídos a artigos neste período.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Artigo</th>
                  <th>Leads</th>
                </tr>
              </thead>
              <tbody>
                {articleLeads.map((row) => (
                  <tr key={row.slug ? `slug:${row.slug}` : `legacy:${row.label}`}>
                    <td>
                      {row.slug && publishedBySlug.has(row.slug) ? (
                        <Link href={`/artigos/${row.slug}`}>{publishedBySlug.get(row.slug)}</Link>
                      ) : (
                        row.label
                      )}
                      {!row.slug && ' (registro antigo sem URL do artigo)'}
                    </td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <Summary title="Campanhas identificadas" rows={campaigns} />
      <Summary title="Regiões de interesse" rows={regions} />

      <section className="admin-card">
        <h2>Como ler estes números</h2>
        <p>
          A origem vem primeiro dos parâmetros UTM do link; quando eles não existem, o navegador
          pode informar o site referenciador. Algumas redes e aplicativos não enviam esse dado:
          nesses casos, a origem permanece sem identificação. Google Imagens, Google Maps e Busca
          podem compartilhar referências, então só distinguimos Maps quando o endereço de origem
          identifica Maps. As visualizações por artigo aparecem somente a partir da ativação do
          rastreamento interno. Para mostrar visitas de todas as páginas, pesquisas, impressões e
          cliques externos, ainda é preciso integrar dados do GA4 e do Google Search Console. O
          artigo é identificado pelo slug gravado com o lead; cadastros antigos usam o título
          disponível na origem e podem não ter link. Os resumos de origem exibem até 10 itens e
          consideram os 5.000 cadastros mais recentes dos últimos 90 dias.
        </p>
        <Link href="/admin/leads">Abrir leads no CRM</Link>
      </section>
    </>
  );
}
