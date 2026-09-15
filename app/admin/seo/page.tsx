import Link from 'next/link';

import { db } from '@/lib/db';
import { calculateSeoScore } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type AuditItem = {
  id: string;
  name: string;
  kind: 'Empreendimento' | 'Bairro' | 'Artigo';
  status: string;
  path: string;
  adminPath: string;
  indexable: boolean;
  score: number;
  maxScore: number;
  percentage: number;
  checks: ReturnType<typeof calculateSeoScore>['checks'];
  seoTitle: string | null;
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Rascunho',
  REVIEW: 'Em revisão',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
  ENTIDADE: 'Página local',
};

function firstFailedCheck(item: AuditItem) {
  return item.checks.find((check) => !check.passed)?.label ?? 'Revisão editorial';
}

function findDuplicateTitles(items: AuditItem[]) {
  const grouped = new Map<string, AuditItem[]>();

  for (const item of items) {
    const title = item.seoTitle?.trim().toLocaleLowerCase('pt-BR');

    if (!title) {
      continue;
    }

    grouped.set(title, [...(grouped.get(title) ?? []), item]);
  }

  return [...grouped.values()].filter((group) => group.length > 1);
}

export default async function SeoMissionControlPage() {
  const [projects, neighborhoods, articles] = await Promise.all([
    db.project.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        heroImage: true,
        seoTitle: true,
        seoDescription: true,
        publishStatus: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
    db.neighborhood.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        heroImage: true,
        seoTitle: true,
        seoDescription: true,
        _count: {
          select: {
            projects: {
              where: {
                publishStatus: 'PUBLISHED',
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
    db.article.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        heroImage: true,
        seoTitle: true,
        seoDescription: true,
        publishStatus: true,
        category: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
  ]);

  const projectAudits: AuditItem[] = projects.map((item) => {
    const result = calculateSeoScore(item);

    return {
      id: item.id,
      name: item.name,
      kind: 'Empreendimento',
      status: item.publishStatus,
      path: `/empreendimentos/${item.slug}`,
      adminPath: `/admin/empreendimentos/${item.id}`,
      indexable: item.publishStatus === 'PUBLISHED',
      seoTitle: item.seoTitle,
      ...result,
    };
  });

  const neighborhoodAudits: AuditItem[] = neighborhoods.map((item) => {
    const result = calculateSeoScore(item);

    return {
      id: item.id,
      name: item.name,
      kind: 'Bairro',
      status: 'ENTIDADE',
      path: `/bairros/${item.slug}`,
      adminPath: `/admin/bairros/${item.id}`,
      indexable: true,
      seoTitle: item.seoTitle,
      ...result,
    };
  });

  const articleAudits: AuditItem[] = articles.map((item) => {
    const result = calculateSeoScore({
      ...item,
      name: item.title,
      description: item.excerpt,
    });

    return {
      id: item.id,
      name: item.title,
      kind: 'Artigo',
      status: item.publishStatus,
      path: `/artigos/${item.slug}`,
      adminPath: `/admin/artigos/${item.id}`,
      indexable: item.publishStatus === 'PUBLISHED',
      seoTitle: item.seoTitle,
      ...result,
    };
  });

  const all = [...projectAudits, ...neighborhoodAudits, ...articleAudits];
  const critical = all.filter((item) => item.score < 60).sort((a, b) => a.score - b.score);
  const duplicates = findDuplicateTitles(all);
  const blocked = all.filter((item) => !item.indexable);
  const readyToPublish = all.filter(
    (item) => !item.indexable && item.score >= 80 && item.status !== 'ARCHIVED',
  );
  const neighborhoodsWithoutProjects = neighborhoods.filter(
    (neighborhood) => neighborhood._count.projects === 0,
  );
  const publishedArticleCategories = new Map<string, number>();

  for (const article of articles) {
    if (article.publishStatus !== 'PUBLISHED' || !article.category?.trim()) {
      continue;
    }

    const category = article.category.trim().toLocaleLowerCase('pt-BR');

    publishedArticleCategories.set(category, (publishedArticleCategories.get(category) ?? 0) + 1);
  }

  const articlesWithGenericLinking = articles.filter((article) => {
    if (article.publishStatus !== 'PUBLISHED') {
      return false;
    }

    const category = article.category?.trim().toLocaleLowerCase('pt-BR');

    return !category || (publishedArticleCategories.get(category) ?? 0) < 2;
  });
  const average = all.length
    ? Math.round(all.reduce((total, item) => total + item.percentage, 0) / all.length)
    : 0;
  const categories: Array<[string, AuditItem[]]> = [
    ['Empreendimentos', projectAudits],
    ['Bairros', neighborhoodAudits],
    ['Artigos', articleAudits],
  ];

  return (
    <>
      <div className="eyebrow">SEO Mission Control</div>

      <h1>Saúde orgânica</h1>

      <p>
        Controle as páginas que podem gerar tráfego orgânico, priorize correções e publique somente
        conteúdos completos.
      </p>

      <div className="kpis">
        <div className="kpi">
          <b>{average}%</b>Saúde média
        </div>

        <div className="kpi">
          <b>{all.filter((item) => item.indexable).length}</b>Páginas indexáveis
        </div>

        <div className="kpi">
          <b>{critical.length}</b>Correções prioritárias
        </div>

        <div className="kpi">
          <b>{readyToPublish.length}</b>Prontas para publicar
        </div>
      </div>

      <div className="panel">
        <h2>Prioridades de otimização</h2>

        {critical.length === 0 ? (
          <p>Nenhuma pendência crítica encontrada.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Página</th>
                  <th>Tipo</th>
                  <th>Score</th>
                  <th>Próxima correção</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {critical.map((item) => (
                  <tr key={`${item.kind}-${item.id}`}>
                    <td>
                      <b>{item.name}</b>
                      <small>{item.path}</small>
                    </td>
                    <td>{item.kind}</td>
                    <td>{item.percentage}%</td>
                    <td>{firstFailedCheck(item)}</td>
                    <td>
                      <Link href={item.adminPath}>Corrigir →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Publicação e indexação</h2>

        <p>
          Rascunhos, itens em revisão e arquivados não devem entrar no sitemap. Esta lista mostra
          páginas com boa estrutura que ainda precisam ser publicadas.
        </p>

        {readyToPublish.length === 0 ? (
          <p>Nenhuma página bloqueada atingiu 80% de qualidade ainda.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Página</th>
                  <th>Status atual</th>
                  <th>Score</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {readyToPublish.map((item) => (
                  <tr key={`publicar-${item.kind}-${item.id}`}>
                    <td>
                      <b>{item.name}</b>
                      <small>{item.path}</small>
                    </td>
                    <td>{statusLabels[item.status] ?? item.status}</td>
                    <td>{item.percentage}%</td>
                    <td>
                      <Link href={item.adminPath}>Revisar e publicar →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Conflitos e cobertura territorial</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Alerta</th>
                <th>Impacto</th>
                <th>Itens envolvidos</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {duplicates.map((group) => (
                <tr key={`duplicado-${group.map((item) => item.id).join('-')}`}>
                  <td>Título SEO duplicado</td>
                  <td>As páginas podem disputar a mesma busca.</td>
                  <td>{group.map((item) => item.name).join(' · ')}</td>
                  <td>
                    <Link href={group[0].adminPath}>Revisar títulos →</Link>
                  </td>
                </tr>
              ))}

              {neighborhoodsWithoutProjects.map((neighborhood) => (
                <tr key={`bairro-${neighborhood.id}`}>
                  <td>Bairro sem empreendimento publicado</td>
                  <td>A página local precisa de conteúdo ou oferta vinculada.</td>
                  <td>{neighborhood.name}</td>
                  <td>
                    <Link href={`/admin/bairros/${neighborhood.id}`}>Completar bairro →</Link>
                  </td>
                </tr>
              ))}

              {duplicates.length === 0 && neighborhoodsWithoutProjects.length === 0 && (
                <tr>
                  <td colSpan={4}>Nenhum conflito de título ou cobertura territorial pendente.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>Linkagem interna dos artigos</h2>

        <p>
          Todo artigo publicado já mantém o visitante em páginas internas da Imóveis de Alto Padrão
          Rio. Esta lista mostra os conteúdos que ainda usam caminhos gerais porque não têm
          categoria editorial ou outro artigo da mesma pauta.
        </p>

        {articlesWithGenericLinking.length === 0 ? (
          <p>
            Todos os artigos publicados já têm contexto editorial para recomendações relacionadas.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Artigo</th>
                  <th>Situação</th>
                  <th>Próxima melhoria</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {articlesWithGenericLinking.map((article) => {
                  const hasCategory = Boolean(article.category?.trim());

                  return (
                    <tr key={`linkagem-${article.id}`}>
                      <td>
                        <b>{article.title}</b>
                        <small>{`/artigos/${article.slug}`}</small>
                      </td>
                      <td>{hasCategory ? article.category : 'Sem categoria editorial'}</td>
                      <td>
                        {hasCategory
                          ? 'Criar ou categorizar outro conteúdo da mesma pauta.'
                          : 'Definir uma categoria editorial para conectar conteúdos relacionados.'}
                      </td>
                      <td>
                        <Link href={`/admin/artigos/${article.id}`}>Aprimorar artigo →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Mapa atual do portal</h2>

        <p>
          {projectAudits.length} empreendimentos, {neighborhoodAudits.length} bairros e{' '}
          {articleAudits.length} artigos acompanhados. A captação pública permanece nos canais da
          Imóveis de Alto Padrão Rio.
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Indexáveis</th>
                <th>Não publicadas</th>
                <th>Score médio</th>
              </tr>
            </thead>

            <tbody>
              {categories.map(([label, items]) => {
                const categoryAverage = items.length
                  ? Math.round(
                      items.reduce((total, item) => total + item.percentage, 0) / items.length,
                    )
                  : 0;

                return (
                  <tr key={label}>
                    <td>{label}</td>
                    <td>{items.filter((item) => item.indexable).length}</td>
                    <td>{items.filter((item) => !item.indexable).length}</td>
                    <td>{categoryAverage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {blocked.length > 0 && (
          <p>
            {blocked.length} páginas permanecem fora da indexação até que estejam prontas para
            publicação.
          </p>
        )}
      </div>
    </>
  );
}
