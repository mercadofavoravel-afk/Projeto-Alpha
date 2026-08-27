'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

type CandidateStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'IMPORTED';

type CandidateKind =
  | 'PROJECT'
  | 'NEIGHBORHOOD'
  | 'DOCUMENT'
  | 'ARTICLE'
  | 'DEVELOPER'
  | 'OTHER';

type Candidate = {
  id: string;
  url: string;
  title: string | null;
  kind: CandidateKind;
  score: number;
  status: CandidateStatus;

  sourceRootId: string;
  sourceRootName: string;
  sourceRootUrl: string;
  sourceRootKind: string | null;

  importedProjectId: string | null;
  metadata: unknown;

  firstSeenAt: string;
  lastSeenAt: string;
  reviewedAt: string | null;
  importedAt: string | null;

  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  ok: boolean;

  filters?: {
    status: CandidateStatus | 'ALL';
    kind: CandidateKind | 'ALL';
    search: string;
  };

  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };

  summary?: {
    status: {
      pending: number;
      approved: number;
      rejected: number;
      imported: number;
    };

    kind: {
      projects: number;
      neighborhoods: number;
      documents: number;
      articles: number;
      developers: number;
      other: number;
    };
  };

  items?: Candidate[];

  error?: string;
};

const kindLabels: Record<
  CandidateKind,
  string
> = {
  PROJECT:
    'Empreendimento',

  NEIGHBORHOOD:
    'Bairro',

  DOCUMENT:
    'Documento',

  ARTICLE:
    'Conteúdo',

  DEVELOPER:
    'Incorporadora',

  OTHER:
    'Outro',
};

const statusLabels: Record<
  CandidateStatus,
  string
> = {
  PENDING:
    'Pendente',

  APPROVED:
    'Aprovado',

  REJECTED:
    'Rejeitado',

  IMPORTED:
    'Importado',
};

function formatDate(
  value: string | null,
) {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
  ).format(date);
}

function ScoreBadge({
  score,
}: {
  score: number;
}) {
  const className =
    score >= 70
      ? 'score score-high'
      : score >= 40
        ? 'score score-medium'
        : 'score';

  return (
    <span className={className}>
      {score}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: CandidateStatus;
}) {
  return (
    <span
      className={`status-badge status-${status.toLowerCase()}`}
    >
      {
        statusLabels[
          status
        ]
      }
    </span>
  );
}

export default function DiscoveryPage() {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionId,
    setActionId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<string[]>([]);

  const [
    data,
    setData,
  ] =
    useState<ApiResponse | null>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      CandidateStatus | 'ALL'
    >('PENDING');

  const [
    kind,
    setKind,
  ] =
    useState<
      CandidateKind | 'ALL'
    >('ALL');

  const [
    searchInput,
    setSearchInput,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    page,
    setPage,
  ] = useState(1);

  const loadCandidates =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const params =
            new URLSearchParams({
              status,
              kind,
              page:
                String(page),
              pageSize:
                '30',
            });

          if (search) {
            params.set(
              'search',
              search,
            );
          }

          const response =
            await fetch(
              `/api/admin/discovery-candidates?${params.toString()}`,
              {
                cache:
                  'no-store',
              },
            );

          const result =
            (await response.json()) as ApiResponse;

          if (
            !response.ok ||
            !result.ok
          ) {
            throw new Error(
              result.error ||
                'Não foi possível carregar a fila.',
            );
          }

          setData(result);
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : 'Não foi possível carregar a fila.',
          );
        } finally {
          setLoading(false);
        }
      },
      [
        status,
        kind,
        search,
        page,
      ],
    );

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  async function updateStatus(
    target: string | string[],
    nextStatus:
      | 'PENDING'
      | 'APPROVED'
      | 'REJECTED',
  ) {
    if (actionId) {
      return;
    }

    const candidateIds =
      Array.isArray(target)
        ? target
        : [target];

    if (candidateIds.length === 0) {
      return;
    }

    setActionId(candidateIds.join(','));
    setError(null);

    try {
      const response =
        await fetch(
          '/api/admin/discovery-candidates',
          {
            method:
              'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                ids: candidateIds,
                status:
                  nextStatus,
              }),
          },
        );

      const result =
        (await response.json()) as {
          ok: boolean;
          error?: string;
        };

      if (
        !response.ok ||
        !result.ok
      ) {
        throw new Error(
          result.error ||
            'Não foi possível atualizar o candidato.',
        );
      }

      setSelectedIds([]);
      await loadCandidates();
    } catch (
      updateError
    ) {
      setError(
        updateError instanceof
          Error
          ? updateError.message
          : 'Não foi possível atualizar o candidato.',
      );
    } finally {
      setActionId(null);
    }
  }

  function toggleCandidate(
    id: string,
  ) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function togglePageSelection() {
    const pageIds = items.map((item) => item.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));

    setSelectedIds(
      allSelected
        ? selectedIds.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...selectedIds, ...pageIds])),
    );
  }

  function submitSearch(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPage(1);

    setSearch(
      searchInput
        .trim(),
    );
  }

  function changeStatus(
    value:
      CandidateStatus | 'ALL',
  ) {
    setPage(1);
    setStatus(value);
  }

  function changeKind(
    value:
      CandidateKind | 'ALL',
  ) {
    setPage(1);
    setKind(value);
  }

  const summary =
    data?.summary;

  const pagination =
    data?.pagination;

  const items =
    data?.items ?? [];

  return (
    <>
      <div className="eyebrow">
        Inteligência de mercado
      </div>

      <h1>
        Fila de Discovery
      </h1>

      <p className="intro">
        Revise as oportunidades
        encontradas automaticamente
        nas fontes monitoradas antes
        que qualquer informação seja
        transformada em conteúdo,
        empreendimento ou ativo
        público do Alpha.
      </p>

      {summary && (
        <>
          <section className="summary-grid">
            <button
              type="button"
              className={
                status ===
                'PENDING'
                  ? 'summary-card active'
                  : 'summary-card'
              }
              onClick={() =>
                changeStatus(
                  'PENDING',
                )
              }
            >
              <span>
                Pendentes
              </span>

              <strong>
                {
                  summary
                    .status
                    .pending
                }
              </strong>
            </button>

            <button
              type="button"
              className={
                status ===
                'APPROVED'
                  ? 'summary-card active'
                  : 'summary-card'
              }
              onClick={() =>
                changeStatus(
                  'APPROVED',
                )
              }
            >
              <span>
                Aprovados
              </span>

              <strong>
                {
                  summary
                    .status
                    .approved
                }
              </strong>
            </button>

            <button
              type="button"
              className={
                status ===
                'REJECTED'
                  ? 'summary-card active'
                  : 'summary-card'
              }
              onClick={() =>
                changeStatus(
                  'REJECTED',
                )
              }
            >
              <span>
                Rejeitados
              </span>

              <strong>
                {
                  summary
                    .status
                    .rejected
                }
              </strong>
            </button>

            <button
              type="button"
              className={
                status ===
                'IMPORTED'
                  ? 'summary-card active'
                  : 'summary-card'
              }
              onClick={() =>
                changeStatus(
                  'IMPORTED',
                )
              }
            >
              <span>
                Importados
              </span>

              <strong>
                {
                  summary
                    .status
                    .imported
                }
              </strong>
            </button>
          </section>

          <section className="kind-summary">
            <div>
              <span>
                Empreendimentos
              </span>

              <strong>
                {
                  summary
                    .kind
                    .projects
                }
              </strong>
            </div>

            <div>
              <span>
                Bairros
              </span>

              <strong>
                {
                  summary
                    .kind
                    .neighborhoods
                }
              </strong>
            </div>

            <div>
              <span>
                Documentos
              </span>

              <strong>
                {
                  summary
                    .kind
                    .documents
                }
              </strong>
            </div>

            <div>
              <span>
                Conteúdo
              </span>

              <strong>
                {
                  summary
                    .kind
                    .articles
                }
              </strong>
            </div>

            <div>
              <span>
                Incorporadoras
              </span>

              <strong>
                {
                  summary
                    .kind
                    .developers
                }
              </strong>
            </div>

            <div>
              <span>
                Outros
              </span>

              <strong>
                {
                  summary
                    .kind
                    .other
                }
              </strong>
            </div>
          </section>
        </>
      )}

      <section className="filters">
        <form
          onSubmit={
            submitSearch
          }
          className="search-form"
        >
          <input
            value={
              searchInput
            }
            onChange={(
              event,
            ) =>
              setSearchInput(
                event
                  .target
                  .value,
              )
            }
            placeholder="Buscar empreendimento, fonte ou URL..."
          />

          <button type="submit">
            Buscar
          </button>

          {search && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setSearchInput(
                  '',
                );

                setSearch('');

                setPage(1);
              }}
            >
              Limpar
            </button>
          )}
        </form>

        <div className="filter-row">
          <select
            value={status}
            onChange={(
              event,
            ) =>
              changeStatus(
                event
                  .target
                  .value as
                  | CandidateStatus
                  | 'ALL',
              )
            }
          >
            <option value="PENDING">
              Pendentes
            </option>

            <option value="APPROVED">
              Aprovados
            </option>

            <option value="REJECTED">
              Rejeitados
            </option>

            <option value="IMPORTED">
              Importados
            </option>

            <option value="ALL">
              Todos os status
            </option>
          </select>

          <select
            value={kind}
            onChange={(
              event,
            ) =>
              changeKind(
                event
                  .target
                  .value as
                  | CandidateKind
                  | 'ALL',
              )
            }
          >
            <option value="ALL">
              Todos os tipos
            </option>

            <option value="PROJECT">
              Empreendimentos
            </option>

            <option value="NEIGHBORHOOD">
              Bairros
            </option>

            <option value="DOCUMENT">
              Documentos
            </option>

            <option value="ARTICLE">
              Conteúdo
            </option>

            <option value="DEVELOPER">
              Incorporadoras
            </option>

            <option value="OTHER">
              Outros
            </option>
          </select>

          <button
            type="button"
            className="refresh"
            onClick={() =>
              void loadCandidates()
            }
            disabled={loading}
          >
            {loading
              ? 'Atualizando...'
              : 'Atualizar fila'}
          </button>
        </div>
      </section>

      {error && (
        <div className="message error">
          <strong>
            Não foi possível concluir a
            operação.
          </strong>

          <span>
            {error}
          </span>
        </div>
      )}

      {loading &&
        !data && (
          <section className="loading-box">
            <div className="pulse" />

            <div>
              <strong>
                Carregando inteligência
              </strong>

              <p>
                Consultando a fila
                persistente de
                candidatos.
              </p>
            </div>
          </section>
        )}

      {!loading &&
        items.length ===
          0 && (
          <section className="empty">
            <strong>
              Nenhum candidato encontrado.
            </strong>

            <p>
              Altere os filtros ou
              execute uma nova
              varredura das fontes.
            </p>
          </section>
        )}

      {items.length > 0 && (
        <section className="bulk-review">
          <label>
            <input
              type="checkbox"
              checked={items.every((item) => selectedIds.includes(item.id))}
              onChange={togglePageSelection}
            />
            Selecionar os {items.length} itens desta página
          </label>

          <strong>{selectedIds.length} selecionados</strong>

          <button
            type="button"
            disabled={selectedIds.length === 0 || Boolean(actionId)}
            onClick={() => void updateStatus(selectedIds, 'APPROVED')}
          >
            Aprovar selecionados
          </button>

          <button
            type="button"
            className="secondary"
            disabled={selectedIds.length === 0 || Boolean(actionId)}
            onClick={() => void updateStatus(selectedIds, 'REJECTED')}
          >
            Rejeitar selecionados
          </button>
        </section>
      )}

      {items.length > 0 && (
        <section className="candidate-list">
          <div className="list-head">
            <div>
              <div className="eyebrow">
                Revisão humana
              </div>

              <h2>
                Candidatos encontrados
              </h2>

              <p>
                Aprovar significa que o
                item pode avançar para a
                próxima etapa de
                inteligência. Ainda não
                significa publicação.
              </p>
            </div>

            <strong>
              {pagination?.total ??
                items.length}
            </strong>
          </div>

          <div className="cards">
            {items.map(
              (candidate) => (
                <article
                  key={
                    candidate.id
                  }
                  className="candidate-card"
                >
                  <div className="candidate-main">
                    <label className="candidate-select">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(candidate.id)}
                        onChange={() => toggleCandidate(candidate.id)}
                      />
                      Selecionar candidato
                    </label>

                    <div className="candidate-top">
                      <div className="badges">
                        <span className="kind-badge">
                          {
                            kindLabels[
                              candidate
                                .kind
                            ]
                          }
                        </span>

                        <StatusBadge
                          status={
                            candidate.status
                          }
                        />

                        <ScoreBadge
                          score={
                            candidate.score
                          }
                        />
                      </div>

                      <small>
                        Última detecção:{' '}
                        {formatDate(
                          candidate.lastSeenAt,
                        )}
                      </small>
                    </div>

                    <h3>
                      {candidate.title ||
                        'Candidato sem título'}
                    </h3>

                    <a
                      href={
                        candidate.url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="candidate-url"
                    >
                      {candidate.url}
                    </a>

                    <div className="source-info">
                      <div>
                        <span>
                          Fonte
                        </span>

                        <strong>
                          {
                            candidate.sourceRootName
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Primeira detecção
                        </span>

                        <strong>
                          {formatDate(
                            candidate.firstSeenAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Revisado
                        </span>

                        <strong>
                          {formatDate(
                            candidate.reviewedAt,
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="candidate-actions">
                    {candidate.status !==
                      'APPROVED' && (
                      <button
                        type="button"
                        className="approve"
                        disabled={
                          actionId ===
                          candidate.id
                        }
                        onClick={() =>
                          void updateStatus(
                            candidate.id,
                            'APPROVED',
                          )
                        }
                      >
                        Aprovar
                      </button>
                    )}

                    {candidate.status !==
                      'REJECTED' && (
                      <button
                        type="button"
                        className="reject"
                        disabled={
                          actionId ===
                          candidate.id
                        }
                        onClick={() =>
                          void updateStatus(
                            candidate.id,
                            'REJECTED',
                          )
                        }
                      >
                        Rejeitar
                      </button>
                    )}

                    {candidate.status !==
                      'PENDING' &&
                      candidate.status !==
                        'IMPORTED' && (
                        <button
                          type="button"
                          className="pending"
                          disabled={
                            actionId ===
                            candidate.id
                          }
                          onClick={() =>
                            void updateStatus(
                              candidate.id,
                              'PENDING',
                            )
                          }
                        >
                          Voltar para pendente
                        </button>
                      )}

                    <a
                      href={
                        candidate.url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="source-link"
                    >
                      Abrir fonte
                    </a>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>
      )}

      {pagination &&
        pagination.totalPages >
          1 && (
          <nav className="pagination">
            <button
              type="button"
              disabled={
                page <= 1 ||
                loading
              }
              onClick={() =>
                setPage(
                  Math.max(
                    1,
                    page - 1,
                  ),
                )
              }
            >
              Anterior
            </button>

            <span>
              Página{' '}
              <strong>
                {pagination.page}
              </strong>{' '}
              de{' '}
              <strong>
                {
                  pagination.totalPages
                }
              </strong>
            </span>

            <button
              type="button"
              disabled={
                page >=
                  pagination.totalPages ||
                loading
              }
              onClick={() =>
                setPage(
                  page + 1,
                )
              }
            >
              Próxima
            </button>
          </nav>
        )}

      <style>{`
        .intro {
          max-width: 820px;
          color: #5f6a70;
          line-height: 1.75;
        }

        .summary-grid {
          margin-top: 32px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .summary-card {
          padding: 24px 20px;
          display: grid;
          gap: 8px;
          text-align: left;
          background: #fff;
          border: 1px solid #ded8cf;
          cursor: pointer;
          color: #1c2b31;
        }

        .summary-card.active {
          border-color: #b3976d;
          box-shadow: inset 0 -3px 0 #b3976d;
        }

        .summary-card span,
        .kind-summary span {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .11em;
          color: #798287;
        }

        .summary-card strong {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 36px;
          font-weight: 400;
        }

        .kind-summary {
          margin-top: 10px;
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
        }

        .kind-summary > div {
          padding: 18px;
          display: grid;
          gap: 7px;
          background: #f7f3ec;
          border: 1px solid #ded5c8;
        }

        .kind-summary strong {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 26px;
          font-weight: 400;
        }

        .filters {
          margin-top: 28px;
          padding: 22px;
          background: #fff;
          border: 1px solid #ded8cf;
        }

        .search-form {
          display: flex;
          gap: 8px;
        }

        .search-form input {
          flex: 1;
          min-height: 46px;
          padding: 0 14px;
          border: 1px solid #d6d0c8;
          font: inherit;
        }

        .search-form button,
        .filter-row button,
        .pagination button {
          min-height: 46px;
          padding: 0 18px;
          border: 0;
          background: #1a2b32;
          color: #fff;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .search-form .secondary {
          color: #1a2b32;
          background: #ebe7e0;
        }

        .filter-row {
          margin-top: 10px;
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 8px;
        }

        .filter-row select {
          min-height: 46px;
          padding: 0 12px;
          border: 1px solid #d6d0c8;
          background: #fff;
          color: #24333a;
        }

        .filter-row .refresh {
          background: #b3976d;
        }

        button:disabled {
          opacity: .55;
          cursor: wait;
        }

        .message {
          margin-top: 20px;
          padding: 18px 22px;
          display: grid;
          gap: 5px;
        }

        .message.error {
          color: #84362e;
          background: #fff1ee;
          border: 1px solid #e4beb7;
        }

        .loading-box {
          margin-top: 24px;
          padding: 26px;
          display: flex;
          align-items: center;
          gap: 18px;
          background: #fff;
          border: 1px solid #ded8cf;
        }

        .loading-box p {
          margin: 5px 0 0;
          color: #68747a;
        }

        .pulse {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #b3976d;
          animation: pulse 1.4s infinite;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(179,151,109,.45);
          }

          70% {
            box-shadow: 0 0 0 14px rgba(179,151,109,0);
          }

          100% {
            box-shadow: 0 0 0 0 rgba(179,151,109,0);
          }
        }

        .empty {
          margin-top: 26px;
          padding: 50px 24px;
          text-align: center;
          color: #667277;
          background: #fff;
          border: 1px dashed #d3ccc3;
        }

        .empty p {
          margin: 8px 0 0;
        }

        .bulk-review {
          margin-top: 22px;
          padding: 18px 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          background: #f7f3ec;
          border: 1px solid #ded5c8;
        }

        .bulk-review label {
          display: flex;
          gap: 9px;
          align-items: center;
          margin-right: auto;
        }

        .bulk-review button {
          min-height: 40px;
          padding: 0 16px;
        }

        .candidate-select {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 14px;
          color: #657075;
          font-size: 12px;
        }

        .candidate-list {
          margin-top: 28px;
        }

        .list-head {
          padding: 28px 30px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 30px;
          align-items: end;
          background: #101a1f;
          color: #fff;
        }

        .list-head h2 {
          margin: 0 0 8px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 32px;
          font-weight: 400;
        }

        .list-head p {
          max-width: 720px;
          margin: 0;
          color: rgba(255,255,255,.62);
          line-height: 1.65;
        }

        .list-head > strong {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 42px;
          font-weight: 400;
          color: #c0a77f;
        }

        .cards {
          display: grid;
          gap: 10px;
          margin-top: 10px;
        }

        .candidate-card {
          padding: 24px;
          display: grid;
          grid-template-columns: 1fr 190px;
          gap: 28px;
          background: #fff;
          border: 1px solid #ded8cf;
        }

        .candidate-top {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
        }

        .candidate-top > small {
          color: #879094;
        }

        .badges {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          align-items: center;
        }

        .kind-badge,
        .status-badge,
        .score {
          min-height: 28px;
          padding: 0 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .08em;
          border: 1px solid #d5cfc6;
        }

        .kind-badge {
          color: #594932;
          background: #f4eee5;
          border-color: #ddcfba;
        }

        .status-pending {
          color: #81661f;
          background: #fff7e3;
          border-color: #ead89e;
        }

        .status-approved {
          color: #23613e;
          background: #eef8f1;
          border-color: #bedcc9;
        }

        .status-rejected {
          color: #84362e;
          background: #fff1ee;
          border-color: #e4beb7;
        }

        .status-imported {
          color: #345a7d;
          background: #edf5fb;
          border-color: #c3d7e6;
        }

        .score {
          color: #6e7477;
          background: #fff;
        }

        .score-medium {
          color: #846522;
          background: #fff7e4;
          border-color: #e9d69f;
        }

        .score-high {
          color: #23613e;
          background: #eef8f1;
          border-color: #bedcc9;
        }

        .candidate-card h3 {
          margin: 17px 0 7px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 26px;
          line-height: 1.2;
          font-weight: 400;
        }

        .candidate-url {
          display: block;
          max-width: 900px;
          color: #496471;
          word-break: break-all;
          font-size: 12px;
        }

        .source-info {
          margin-top: 20px;
          padding-top: 18px;
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 16px;
          border-top: 1px solid #ece7df;
        }

        .source-info div {
          display: grid;
          gap: 4px;
        }

        .source-info span {
          color: #8a9295;
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
        }

        .source-info strong {
          font-size: 12px;
          font-weight: 600;
        }

        .candidate-actions {
          display: grid;
          align-content: start;
          gap: 8px;
        }

        .candidate-actions button,
        .source-link {
          min-height: 42px;
          padding: 0 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          cursor: pointer;
          font-size: 9px;
          font-weight: 700;
          text-align: center;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .candidate-actions .approve {
          color: #fff;
          background: #275d40;
        }

        .candidate-actions .reject {
          color: #fff;
          background: #8b443c;
        }

        .candidate-actions .pending {
          color: #29383e;
          background: #ece8e1;
        }

        .source-link {
          color: #fff;
          background: #1a2b32;
        }

        .pagination {
          margin-top: 22px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 18px;
        }

        .pagination span {
          color: #667176;
          font-size: 12px;
        }

        @media (max-width: 1100px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .kind-summary {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 800px) {
          .summary-grid,
          .kind-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .search-form {
            display: grid;
          }

          .filter-row {
            grid-template-columns: 1fr;
          }

          .candidate-card {
            grid-template-columns: 1fr;
          }

          .source-info {
            grid-template-columns: 1fr;
          }

          .candidate-actions {
            grid-template-columns: repeat(2, 1fr);
          }

          .list-head {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
