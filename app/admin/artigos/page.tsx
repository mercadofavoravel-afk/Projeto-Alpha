import Link from 'next/link';

import { createArticleAction } from './actions';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { getArticleNeighborhood } from '@/lib/article-origin';
import { alphaPath } from '@/lib/public-path';

export const dynamic = 'force-dynamic';

const statusLabels = {
  DRAFT: 'Rascunho',
  REVIEW: 'Em revisão',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

const trackedRegions = [
  'Ipanema',
  'Leblon',
  'Gávea',
  'Jardim Botânico',
  'Botafogo',
  'Flamengo',
  'São Conrado',
  'Barra da Tijuca',
  'Recreio dos Bandeirantes',
  'Jacarepaguá',
  'Tijuca',
  'Centro',
  'Porto Maravilha',
] as const;

export default async function ArticlesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; regiao?: string }>;
}) {
  await requirePermission('catalog:write');

  const params = await searchParams;
  const articles = await db.article.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
  });
  const regions = articles.map((article) =>
    getArticleNeighborhood(`${article.title} ${article.category || ''}`),
  );
  const availableRegions: string[] = [
    ...trackedRegions,
    ...[...new Set(regions)]
      .filter((region) => !trackedRegions.some((tracked) => tracked === region))
      .sort((a, b) => a.localeCompare(b, 'pt-BR')),
  ];
  const selectedStatus = Object.keys(statusLabels).includes(params.status || '')
    ? params.status
    : '';
  const selectedRegion = availableRegions.includes(params.regiao || '') ? params.regiao : '';
  const visibleArticles = articles.filter(
    (article, index) =>
      (!selectedStatus || article.publishStatus === selectedStatus) &&
      (!selectedRegion || regions[index] === selectedRegion),
  );
  const regionCounts = availableRegions.map((region) => ({
    region,
    count: regions.filter((value) => value === region).length,
    draft: articles.filter(
      (article, index) => regions[index] === region && article.publishStatus === 'DRAFT',
    ).length,
    review: articles.filter(
      (article, index) => regions[index] === region && article.publishStatus === 'REVIEW',
    ).length,
    published: articles.filter(
      (article, index) => regions[index] === region && article.publishStatus === 'PUBLISHED',
    ).length,
  }));

  const suggestedTopics = [
    'Por que investir em Ipanema: localização, liquidez e estilo de vida',
    'Studios no Rio de Janeiro: quando o investimento faz sentido',
    'Como escolher um imóvel de alto padrão na Barra da Tijuca',
    'Morar ou investir em Leblon: o que avaliar antes da decisão',
    'Valorização imobiliária no Rio: fatores que influenciam cada bairro',
    'Imóvel novo ou pronto: qual opção combina com seu momento',
  ];

  return (
    <>
      <div className="eyebrow">SEO editorial</div>

      <h1>Artigos</h1>

      <p>
        Crie conteúdo para captar buscas orgânicas. Somente artigos publicados aparecem no site
        público e no sitemap.
      </p>

      <div className="kpis">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div className="kpi" key={status}>
            <b>{articles.filter((article) => article.publishStatus === status).length}</b>
            {label}
          </div>
        ))}
      </div>

      <section className="panel">
        <h2>Artigos por região</h2>
        <p>Região inferida do título e da categoria; confira o conteúdo antes de publicar.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Região</th>
                <th>Rascunhos</th>
                <th>Em revisão</th>
                <th>Publicados</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {regionCounts.map(({ region, count, draft, review, published }) => (
                <tr key={region}>
                  <td>{region}</td>
                  <td>{draft}</td>
                  <td>{review}</td>
                  <td>{published}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>O total também inclui artigos arquivados.</p>
      </section>

      <section className="panel">
        <h2>Pautas próprias de SEO</h2>
        <p>
          Crie rascunhos a partir de temas de busca. Cada artigo deve usar pesquisa como referência,
          texto original e CTA direcionado à Imóveis de Alto Padrão Rio.
        </p>
        <div className="topic-grid">
          {suggestedTopics.map((topic) => (
            <form action={createArticleAction} key={topic} className="topic-card">
              <strong>{topic}</strong>
              <input type="hidden" name="title" value={topic} />
              <button className="secondary" type="submit">
                Criar rascunho
              </button>
            </form>
          ))}
        </div>
      </section>

      <form action={createArticleAction} className="panel form-grid">
        <label>
          Título do novo artigo
          <input
            name="title"
            required
            minLength={5}
            placeholder="Ex.: Por que investir em Ipanema?"
          />
        </label>

        <button className="primary" type="submit">
          Criar rascunho
        </button>
      </form>

      <div className="panel">
        <h2>Biblioteca editorial</h2>

        <form action={alphaPath('/admin/artigos')} className="editor-grid">
          <label>
            Situação
            <select name="status" defaultValue={selectedStatus}>
              <option value="">Todas</option>
              {Object.entries(statusLabels).map(([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Região
            <select name="regiao" defaultValue={selectedRegion}>
              <option value="">Todas</option>
              {availableRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </label>
          <div>
            <button className="btn" type="submit">
              Filtrar
            </button>{' '}
            <Link className="btn btn-ghost" href="/admin/artigos">
              Limpar
            </Link>
          </div>
        </form>
        <p>
          Mostrando {visibleArticles.length} de {articles.length} artigos cadastrados.
        </p>

        {visibleArticles.length === 0 ? (
          <p>Nenhum artigo encontrado para estes filtros.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Artigo</th>
                  <th>Região</th>
                  <th>Status</th>
                  <th>Atualizado</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {visibleArticles.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <b>{article.title}</b>
                      <small>
                        {article.publishStatus === 'PUBLISHED'
                          ? `/alpha/artigos/${article.slug}`
                          : 'Página pública indisponível até a publicação'}
                      </small>
                    </td>
                    <td>{getArticleNeighborhood(`${article.title} ${article.category || ''}`)}</td>
                    <td>{statusLabels[article.publishStatus]}</td>
                    <td>{article.updatedAt.toLocaleDateString('pt-BR')}</td>
                    <td>
                      <Link href={`/admin/artigos/${article.id}`}>Editar</Link>
                      {article.publishStatus === 'PUBLISHED' && (
                        <>
                          {' · '}
                          <Link href={`/artigos/${article.slug}`}>Abrir página</Link>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
