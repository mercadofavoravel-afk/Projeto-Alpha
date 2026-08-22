'use client';

import { useState } from 'react';

type ScanItem = {
  url: string;
  title: string | null;
  kind:
    | 'project'
    | 'neighborhood'
    | 'developer'
    | 'article'
    | 'document'
    | 'other';
  score: number;
  sourceRootId: string;
  sourceRootName: string;
  sourceRootUrl: string;
  priority: number;
  discoveredViaUrl?: string;
  discoveredFromExternal?: boolean;
};

type ScanError = {
  sourceRootName: string;
  sourceRootUrl: string;
  message: string;
};

type QueueSummary = {
  pending: number;
  approved: number;
  rejected: number;
  imported: number;
};

type BatchResponse = {
  ok: boolean;

  batch?: {
    cursor: number;
    nextCursor: number | null;
    batchSize: number;
    totalSources: number;
    hasMore: boolean;
    sourceIds: string[];
    externalTargetsScanned: number;
  };

  summary?: {
    sourcesScanned: number;
    totalDiscovered: number;
    projects: number;
    neighborhoods: number;
    documents: number;
    articles: number;
    developers: number;
    other: number;
    errors: number;
  };

  persistence?: {
    created: number;
    updated: number;
    total: number;
    queue: QueueSummary;
  };

  result?: {
    startedAt: string;
    finishedAt: string;
    projects: ScanItem[];
    neighborhoods: ScanItem[];
    documents: ScanItem[];
    articles: ScanItem[];
    developers: ScanItem[];
    other: ScanItem[];
    errors: ScanError[];
  };

  error?: string;
};

type SetupResponse = {
  ok: boolean;
  message?: string;
  table?: string;
  error?: string;
};

type AggregateResult = {
  totalSources: number;
  processedSources: number;
  externalTargetsScanned: number;

  created: number;
  updated: number;

  queue: QueueSummary;

  projects: ScanItem[];
  neighborhoods: ScanItem[];
  documents: ScanItem[];
  articles: ScanItem[];
  developers: ScanItem[];
  other: ScanItem[];
  errors: ScanError[];
};

function uniqueItems(
  items: ScanItem[],
) {
  const seen =
    new Set<string>();

  return items.filter(
    (item) => {
      const key =
        item.url
          .trim()
          .toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    },
  );
}

function ResultTable({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: ScanItem[];
}) {
  return (
    <section className="sources-result">
      <div className="sources-result-head">
        <div>
          <div className="eyebrow">
            Descoberta automática
          </div>

          <h2>{title}</h2>

          <p>{description}</p>
        </div>

        <strong>{items.length}</strong>
      </div>

      {items.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Fonte</th>

                <th>
                  Página encontrada
                </th>

                <th>Score</th>
              </tr>
            </thead>

            <tbody>
              {items.map(
                (item) => (
                  <tr key={item.url}>
                    <td>
                      <strong>
                        {
                          item.sourceRootName
                        }
                      </strong>

                      {item.discoveredFromExternal &&
                        item.discoveredViaUrl && (
                          <small>
                            Via:{' '}
                            {
                              item.discoveredViaUrl
                            }
                          </small>
                        )}
                    </td>

                    <td>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.title ||
                          item.url}
                      </a>

                      <small>
                        {item.url}
                      </small>
                    </td>

                    <td>
                      <span
                        className={
                          item.score >= 70
                            ? 'score score-high'
                            : item.score >= 40
                              ? 'score score-medium'
                              : 'score'
                        }
                      >
                        {item.score}
                      </span>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="sources-empty">
          Nenhum item encontrado nesta
          categoria.
        </div>
      )}
    </section>
  );
}

export default function SourcesPage() {
  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    progress,
    setProgress,
  ] = useState({
    processed: 0,
    total: 0,
  });

  const [
    aggregate,
    setAggregate,
  ] =
    useState<AggregateResult | null>(
      null,
    );

  const [
    scanError,
    setScanError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    setupLoading,
    setSetupLoading,
  ] = useState(false);

  const [
    setupData,
    setSetupData,
  ] =
    useState<SetupResponse | null>(
      null,
    );

  async function runSetup() {
    if (setupLoading) {
      return;
    }

    setSetupLoading(true);
    setSetupData(null);

    try {
      const response =
        await fetch(
          '/api/admin/setup-discovery',
          {
            method: 'POST',
          },
        );

      const result =
        (await response.json()) as SetupResponse;

      setSetupData(result);
    } catch {
      setSetupData({
        ok: false,
        error:
          'Não foi possível preparar a fila de candidatos.',
      });
    } finally {
      setSetupLoading(false);
    }
  }

  async function requestBatch(
    cursor: number,
  ) {
    const response =
      await fetch(
        '/api/admin/source-scan',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            cursor,
            batchSize: 3,
          }),
        },
      );

    const result =
      (await response.json()) as BatchResponse;

    if (
      !response.ok ||
      !result.ok
    ) {
      throw new Error(
        result.error ||
          'Não foi possível executar este lote.',
      );
    }

    return result;
  }

  async function runScan() {
    if (loading) {
      return;
    }

    setLoading(true);
    setAggregate(null);
    setScanError(null);

    setProgress({
      processed: 0,
      total: 0,
    });

    let cursor = 0;

    let accumulated:
      AggregateResult = {
        totalSources: 0,
        processedSources: 0,
        externalTargetsScanned: 0,

        created: 0,
        updated: 0,

        queue: {
          pending: 0,
          approved: 0,
          rejected: 0,
          imported: 0,
        },

        projects: [],
        neighborhoods: [],
        documents: [],
        articles: [],
        developers: [],
        other: [],
        errors: [],
      };

    try {
      while (true) {
        const batch =
          await requestBatch(
            cursor,
          );

        if (
          !batch.batch ||
          !batch.result ||
          !batch.persistence
        ) {
          throw new Error(
            'Resposta incompleta do lote de varredura.',
          );
        }

        accumulated = {
          totalSources:
            batch.batch.totalSources,

          processedSources:
            Math.min(
              batch.batch.cursor +
                batch.batch.batchSize,
              batch.batch.totalSources,
            ),

          externalTargetsScanned:
            accumulated.externalTargetsScanned +
            batch.batch.externalTargetsScanned,

          created:
            accumulated.created +
            batch.persistence.created,

          updated:
            accumulated.updated +
            batch.persistence.updated,

          queue:
            batch.persistence.queue,

          projects:
            uniqueItems([
              ...accumulated.projects,
              ...batch.result.projects,
            ]),

          neighborhoods:
            uniqueItems([
              ...accumulated.neighborhoods,
              ...batch.result.neighborhoods,
            ]),

          documents:
            uniqueItems([
              ...accumulated.documents,
              ...batch.result.documents,
            ]),

          articles:
            uniqueItems([
              ...accumulated.articles,
              ...batch.result.articles,
            ]),

          developers:
            uniqueItems([
              ...accumulated.developers,
              ...batch.result.developers,
            ]),

          other:
            uniqueItems([
              ...accumulated.other,
              ...batch.result.other,
            ]),

          errors: [
            ...accumulated.errors,
            ...batch.result.errors,
          ],
        };

        setAggregate(
          accumulated,
        );

        setProgress({
          processed:
            accumulated.processedSources,

          total:
            accumulated.totalSources,
        });

        if (
          !batch.batch.hasMore ||
          batch.batch.nextCursor ===
            null
        ) {
          break;
        }

        cursor =
          batch.batch.nextCursor;

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              350,
            ),
        );
      }
    } catch (error) {
      setScanError(
        error instanceof Error
          ? error.message
          : 'Não foi possível executar a varredura das fontes.',
      );
    } finally {
      setLoading(false);
    }
  }

  const totalDiscovered =
    aggregate
      ? uniqueItems([
          ...aggregate.projects,
          ...aggregate.neighborhoods,
          ...aggregate.documents,
          ...aggregate.articles,
          ...aggregate.developers,
          ...aggregate.other,
        ]).length
      : 0;

  const progressPercent =
    progress.total > 0
      ? Math.round(
          (progress.processed /
            progress.total) *
            100,
        )
      : 0;

  return (
    <>
      <div className="eyebrow">
        Inteligência de mercado
      </div>

      <h1>Fontes</h1>

      <p className="sources-intro">
        O Alpha monitora fontes
        aprovadas para descobrir
        empreendimentos, bairros,
        documentos e conteúdos
        relevantes. As fontes são
        inteligência e evidência; o
        conteúdo público do Alpha é
        produzido separadamente.
      </p>

      <section className="discovery-setup">
        <div>
          <div className="eyebrow">
            Infraestrutura de
            descoberta
          </div>

          <h2>
            Fila persistente de
            candidatos
          </h2>

          <p>
            Estrutura utilizada para
            guardar permanentemente cada
            oportunidade descoberta pelo
            Alpha antes de qualquer
            publicação.
          </p>

          <div className="setup-flow">
            <span>
              Descoberto
            </span>

            <b>→</b>

            <span>
              Pendente
            </span>

            <b>→</b>

            <span>
              Aprovado
            </span>

            <b>→</b>

            <span>
              Importado
            </span>
          </div>
        </div>

        <div className="setup-action">
          <button
            type="button"
            onClick={runSetup}
            disabled={
              setupLoading ||
              loading
            }
          >
            {setupLoading
              ? 'Preparando fila...'
              : 'Preparar fila de candidatos'}
          </button>

          <small>
            Operação administrativa e
            idempotente. Não apaga nem
            altera empreendimentos
            existentes.
          </small>
        </div>
      </section>

      {setupLoading && (
        <section className="status-box">
          <div className="scan-pulse" />

          <div>
            <strong>
              Preparando estrutura
            </strong>

            <p>
              O Alpha está verificando a
              fila persistente.
            </p>
          </div>
        </section>
      )}

      {setupData?.ok && (
        <div className="message success">
          <strong>
            Fila preparada com sucesso.
          </strong>

          <span>
            {setupData.message ??
              'A estrutura DiscoveryCandidate está disponível.'}
          </span>
        </div>
      )}

      {setupData &&
        !setupData.ok && (
          <div className="message error">
            <strong>
              Não foi possível preparar
              a fila.
            </strong>

            <span>
              {setupData.error ??
                'Ocorreu um erro inesperado.'}
            </span>
          </div>
        )}

      <section className="scan-hero">
        <div>
          <div className="eyebrow">
            Source Discovery
          </div>

          <h2>
            Monitore o mercado em lotes,
            sem interromper a varredura.
          </h2>

          <p>
            O Alpha percorre as fontes
            cadastradas em pequenos
            grupos, segue gateways
            externos quando permitido e
            salva cada descoberta antes
            de continuar para o próximo
            lote.
          </p>

          <div className="scan-features">
            <span>
              Incorporadoras
            </span>

            <span>
              Linktrees
            </span>

            <span>
              Portais
            </span>

            <span>
              Empreendimentos
            </span>

            <span>
              Documentos
            </span>

            <span>
              Conteúdo editorial
            </span>
          </div>
        </div>

        <div className="scan-action">
          <button
            type="button"
            onClick={runScan}
            disabled={
              loading ||
              setupLoading
            }
          >
            {loading
              ? 'Varredura em andamento...'
              : 'Varrer todas as fontes'}
          </button>

          <small>
            A tela chama os lotes
            automaticamente até chegar
            à última fonte.
          </small>
        </div>
      </section>

      {loading && (
        <section className="progress-card">
          <div className="progress-head">
            <div>
              <strong>
                Varredura em andamento
              </strong>

              <p>
                {progress.total > 0
                  ? `${progress.processed} de ${progress.total} fontes processadas`
                  : 'Preparando o primeiro lote...'}
              </p>
            </div>

            <strong className="progress-number">
              {progressPercent}%
            </strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width:
                  `${progressPercent}%`,
              }}
            />
          </div>
        </section>
      )}

      {scanError && (
        <div className="message error">
          <strong>
            A varredura foi interrompida.
          </strong>

          <span>
            {scanError}
          </span>

          {aggregate &&
            aggregate.processedSources >
              0 && (
              <small>
                Os lotes concluídos antes
                do erro já foram salvos
                no banco.
              </small>
            )}
        </div>
      )}

      {aggregate && (
        <>
          <section className="scan-summary">
            <article>
              <span>
                Fontes processadas
              </span>

              <strong>
                {
                  aggregate.processedSources
                }
                /
                {
                  aggregate.totalSources
                }
              </strong>
            </article>

            <article>
              <span>
                Páginas descobertas
              </span>

              <strong>
                {totalDiscovered}
              </strong>
            </article>

            <article>
              <span>
                Empreendimentos
              </span>

              <strong>
                {
                  aggregate.projects
                    .length
                }
              </strong>
            </article>

            <article>
              <span>
                Destinos externos
              </span>

              <strong>
                {
                  aggregate.externalTargetsScanned
                }
              </strong>
            </article>

            <article>
              <span>
                Novos na fila
              </span>

              <strong>
                {aggregate.created}
              </strong>
            </article>

            <article>
              <span>
                Atualizados
              </span>

              <strong>
                {aggregate.updated}
              </strong>
            </article>
          </section>

          <section className="queue-summary">
            <article>
              <span>
                Pendentes
              </span>

              <strong>
                {
                  aggregate.queue
                    .pending
                }
              </strong>
            </article>

            <article>
              <span>
                Aprovados
              </span>

              <strong>
                {
                  aggregate.queue
                    .approved
                }
              </strong>
            </article>

            <article>
              <span>
                Rejeitados
              </span>

              <strong>
                {
                  aggregate.queue
                    .rejected
                }
              </strong>
            </article>

            <article>
              <span>
                Importados
              </span>

              <strong>
                {
                  aggregate.queue
                    .imported
                }
              </strong>
            </article>
          </section>

          <ResultTable
            title="Empreendimentos candidatos"
            description="Produtos imobiliários identificados nas fontes e gateways monitorados."
            items={
              aggregate.projects
            }
          />

          <ResultTable
            title="Bairros e localizações"
            description="Páginas territoriais candidatas à inteligência local do Alpha."
            items={
              aggregate.neighborhoods
            }
          />

          <ResultTable
            title="Documentos"
            description="Books, PDFs e materiais identificados para posterior ingestão de inteligência."
            items={
              aggregate.documents
            }
          />

          <ResultTable
            title="Conteúdo editorial"
            description="Conteúdo de mercado utilizado como fonte de evidência e inteligência, sem cópia automática para páginas públicas."
            items={
              aggregate.articles
            }
          />

          {aggregate.errors.length >
            0 && (
            <section className="scan-errors">
              <div className="eyebrow">
                Fontes com falha
              </div>

              <h2>
                Algumas fontes não
                responderam.
              </h2>

              <p>
                As demais continuam
                processadas normalmente.
              </p>

              {aggregate.errors.map(
                (
                  error,
                  index,
                ) => (
                  <div
                    key={`${error.sourceRootUrl}-${index}`}
                    className="scan-error-item"
                  >
                    <strong>
                      {
                        error.sourceRootName
                      }
                    </strong>

                    <span>
                      {error.message}
                    </span>
                  </div>
                ),
              )}
            </section>
          )}
        </>
      )}

      <style>{`
        .sources-intro {
          max-width: 820px;
          color: #5f6a70;
          line-height: 1.75;
        }

        .discovery-setup {
          margin-top: 34px;
          padding: 30px 34px;
          display: grid;
          grid-template-columns: 1.2fr .8fr;
          gap: 50px;
          align-items: center;
          background: #f7f3ec;
          border: 1px solid #ded5c8;
        }

        .discovery-setup h2 {
          margin: 0 0 12px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 32px;
          font-weight: 400;
        }

        .discovery-setup p {
          max-width: 700px;
          margin: 0;
          color: #657075;
          line-height: 1.7;
        }

        .setup-flow,
        .scan-features {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 22px;
          align-items: center;
        }

        .setup-flow span {
          padding: 8px 10px;
          border: 1px solid #d7cbb9;
          background: #fff;
          color: #6c5b44;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
        }

        .setup-flow b {
          color: #b3976d;
        }

        .setup-action,
        .scan-action {
          display: grid;
          gap: 12px;
        }

        .setup-action button,
        .scan-action button {
          min-height: 60px;
          padding: 0 22px;
          border: 0;
          cursor: pointer;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: .11em;
          font-size: 10px;
          font-weight: 700;
        }

        .setup-action button {
          background: #1a2b32;
        }

        .scan-action button {
          background: #b3976d;
        }

        button:disabled {
          opacity: .65;
          cursor: wait;
        }

        .setup-action small,
        .scan-action small {
          line-height: 1.55;
          opacity: .7;
        }

        .scan-hero {
          margin-top: 28px;
          padding: 42px;
          display: grid;
          grid-template-columns: 1.2fr .8fr;
          gap: 70px;
          align-items: center;
          background: linear-gradient(
            135deg,
            #101a1f,
            #20343c
          );
          color: #fff;
        }

        .scan-hero h2 {
          margin: 0;
          max-width: 760px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(34px, 4vw, 52px);
          line-height: 1.02;
          font-weight: 400;
          letter-spacing: -.03em;
        }

        .scan-hero p {
          max-width: 700px;
          margin: 22px 0;
          color: rgba(255,255,255,.66);
          line-height: 1.75;
        }

        .scan-features span {
          padding: 8px 10px;
          border: 1px solid rgba(255,255,255,.15);
          color: rgba(255,255,255,.72);
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
        }

        .status-box,
        .progress-card {
          margin-top: 22px;
          padding: 24px;
          background: #fff;
          border: 1px solid #d8d0c5;
        }

        .status-box {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .status-box p,
        .progress-card p {
          margin: 5px 0 0;
          color: #69747a;
        }

        .scan-pulse {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: #b3976d;
          animation: sourcePulse 1.4s infinite;
        }

        @keyframes sourcePulse {
          0% {
            box-shadow: 0 0 0 0 rgba(179,151,109,.5);
          }

          70% {
            box-shadow: 0 0 0 14px rgba(179,151,109,0);
          }

          100% {
            box-shadow: 0 0 0 0 rgba(179,151,109,0);
          }
        }

        .progress-head {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: center;
        }

        .progress-number {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 34px;
          font-weight: 400;
          color: #a28761;
        }

        .progress-track {
          height: 8px;
          margin-top: 18px;
          overflow: hidden;
          background: #ece7df;
        }

        .progress-fill {
          height: 100%;
          background: #b3976d;
          transition: width .25s ease;
        }

        .message {
          margin-top: 20px;
          padding: 18px 22px;
          display: grid;
          gap: 5px;
        }

        .message.success {
          color: #1d603b;
          background: #edf8f1;
          border: 1px solid #bfdcc9;
        }

        .message.error {
          color: #84362e;
          background: #fff1ee;
          border: 1px solid #e4beb7;
        }

        .scan-summary {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
        }

        .queue-summary {
          margin-top: 10px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .scan-summary article,
        .queue-summary article {
          padding: 22px 18px;
          background: #fff;
          border: 1px solid #ded8cf;
          display: grid;
          gap: 8px;
        }

        .scan-summary span,
        .queue-summary span {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: .1em;
          color: #798287;
        }

        .scan-summary strong,
        .queue-summary strong {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 32px;
          font-weight: 400;
        }

        .sources-result {
          margin-top: 28px;
          padding: 30px;
          background: #fff;
          border: 1px solid #ded8cf;
        }

        .sources-result-head {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 30px;
          align-items: end;
          margin-bottom: 26px;
        }

        .sources-result-head h2 {
          margin: 0 0 8px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 30px;
          font-weight: 400;
        }

        .sources-result-head p {
          margin: 0;
          max-width: 720px;
          color: #6a757a;
          line-height: 1.65;
        }

        .sources-result-head > strong {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 40px;
          font-weight: 400;
          color: #a28761;
        }

        .sources-result td a {
          color: #1c2b31;
          font-weight: 700;
        }

        .sources-result td small {
          display: block;
          max-width: 650px;
          margin-top: 5px;
          word-break: break-all;
          color: #818a8e;
        }

        .score {
          display: inline-flex;
          min-width: 40px;
          min-height: 30px;
          align-items: center;
          justify-content: center;
          border: 1px solid #d6d0c8;
          color: #6e7477;
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

        .sources-empty {
          padding: 38px;
          text-align: center;
          border: 1px dashed #d5cec4;
          color: #747e83;
        }

        .scan-errors {
          margin-top: 28px;
          padding: 28px;
          color: #7d3c33;
          background: #fff3f0;
          border: 1px solid #e5c5be;
        }

        .scan-errors h2 {
          margin: 0 0 8px;
        }

        .scan-errors > p {
          margin: 0 0 20px;
        }

        .scan-error-item {
          padding: 14px 0;
          display: grid;
          gap: 5px;
          border-top: 1px solid rgba(125,60,51,.14);
        }

        @media (max-width: 1050px) {
          .scan-summary {
            grid-template-columns: repeat(3, 1fr);
          }

          .queue-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 800px) {
          .discovery-setup,
          .scan-hero {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 26px;
          }

          .scan-summary,
          .queue-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .sources-result {
            padding: 20px;
          }

          .sources-result-head {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
