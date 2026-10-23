'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { alphaPath } from '@/lib/public-path';
import type { buildArticlePerformance } from '@/lib/article-performance';
type Data = ReturnType<typeof buildArticlePerformance> & { updatedAt: string; startDate: string };
const stamp = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
export function ArticlePerformancePanel() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('views');
  const refresh = useCallback(async () => {
    try {
      const response = await fetch(alphaPath('/api/admin/artigos/desempenho'), {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error();
      const value: Data = await response.json();
      setData(value);
      setError('');
    } catch {
      setError('Não foi possível atualizar os resultados. Tente novamente.');
    }
  }, []);
  useEffect(() => {
    void refresh();
    const update = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const timer = window.setInterval(update, 30000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, [refresh]);
  const rows = (data?.rows ?? [])
    .filter((row) => `${row.title} ${row.category}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      const value = (row: typeof a) =>
        sort === 'leads'
          ? row.leads
          : sort === 'impressions'
            ? (row.google?.impressions ?? -1)
            : sort === 'google'
              ? (row.google?.clicks ?? -1)
              : row.views;
      return value(b) - value(a) || a.title.localeCompare(b.title, 'pt-BR');
    });
  return (
    <>
      <p>
        Visão dos últimos 28 dias. As visitas e os cliques de atendimento registrados no Alpha
        atualizam a cada 30 segundos com o painel aberto. Visualizações incluem retornos e acessos
        internos; não são pessoas únicas nem cliques do Google.
      </p>
      <p>
        Search Console: cliques e impressões orgânicos do Google, com atraso do fornecedor e datas
        próprias.{' '}
        {data?.search
          ? `Última importação: ${stamp(data.search.fetchedAt)}. Último dia com dados: ${data.search.lastDataDate || 'sem linhas retornadas'}.`
          : data
            ? 'Nenhuma importação válida disponível.'
            : 'Aguardando a consulta dos dados.'}{' '}
        “—” significa ausência de dados retornados, não prova de falta de indexação.
      </p>
      <p>
        Impressões e cliques de anúncios e redes sociais ainda não estão integrados por artigo. A
        plataforma de uma visita é identificada pelas UTMs ou referência disponível; sem evidência,
        fica não identificada. Cadastros são leads recebidos no CRM e podem incluir testes.
      </p>
      {error && <p role="alert">{error}</p>}
      {!data ? (
        <div>
          <p role="status">{error ? 'Os resultados não carregaram.' : 'Carregando resultados…'}</p>
          {error && (
            <button className="btn" onClick={() => void refresh()}>
              Tentar novamente
            </button>
          )}
        </div>
      ) : (
        <>
          <p>
            {data.rows.length} artigos publicados · consulta Alpha: {stamp(data.updatedAt)} · desde{' '}
            {data.startDate} (Brasília).
          </p>
          <div className="button-row">
            <button className="btn" onClick={() => void refresh()}>
              Atualizar agora
            </button>
            <Link href="/admin/artigos">Publicações</Link>
          </div>
          <div className="form-grid">
            <label>
              Buscar artigo ou bairro
              <input value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label>
              Ordenar por
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="views">Mais visualizações</option>
                <option value="leads">Mais leads</option>
                <option value="google">Mais cliques no Google</option>
                <option value="impressions">Mais impressões no Google</option>
              </select>
            </label>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Artigo</th>
                  <th>Visitas hoje</th>
                  <th>Visualizações</th>
                  <th>Orgânicas</th>
                  <th>Pagas</th>
                  <th>Cliques de atendimento</th>
                  <th>Leads</th>
                  <th>Google: cliques</th>
                  <th>Google: impressões</th>
                  <th>Google: CTR</th>
                  <th>Google: posição</th>
                  <th>Origem e resultado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.slug}>
                    <td>
                      <Link href={`/artigos/${row.slug}`}>{row.title}</Link>
                      <small>{row.category}</small>
                    </td>
                    <td>{row.viewsToday}</td>
                    <td>{row.views}</td>
                    <td>{row.organicViews}</td>
                    <td>{row.paidViews}</td>
                    <td>{row.contactClicks}</td>
                    <td>{row.leads}</td>
                    <td>{row.google?.clicks ?? '—'}</td>
                    <td>{row.google?.impressions ?? '—'}</td>
                    <td>{row.google ? `${(row.google.ctr * 100).toFixed(2)}%` : '—'}</td>
                    <td>{row.google?.position?.toFixed(1) ?? '—'}</td>
                    <td>
                      <details>
                        <summary>Ver plataformas</summary>
                        {row.channels.length ? (
                          row.channels.map((c, i) => (
                            <p key={i}>
                              {c.platform} · {c.kind}: {c.views} visualizações, {c.clicks} cliques
                              de atendimento, {c.leads} leads
                            </p>
                          ))
                        ) : (
                          <p>Sem registros no Alpha neste período.</p>
                        )}
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Cliques de atendimento medem acionamentos de botões, não comprovam conversa ou lead. A
            divisão orgânico/pago depende da marcação capturada.
          </p>
        </>
      )}
    </>
  );
}
