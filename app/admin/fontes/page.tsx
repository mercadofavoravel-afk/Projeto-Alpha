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
};

type ScanError = {
  sourceRootName: string;
  sourceRootUrl: string;
  message: string;
};

type ScanResponse = {
  ok: boolean;

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
                          item.score >=
                          70
                            ? 'score score-high'
                            : item.score >=
                                40
                              ? 'score score-medium'
                              : 'score'
                        }
                      >
                        {
                          item.score
                        }
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
    data,
    setData,
  ] =
    useState<ScanResponse | null>(
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

  async function runScan() {
    if (loading) {
      return;
    }

    setLoading(true);
    setData(null);

    try {
      const response =
        await fetch(
          '/api/admin/source-scan',
          {
            method: 'POST',
          },
        );

      const result =
        (await response.json()) as ScanResponse;

      setData(result);
    } catch {
      setData({
        ok: false,
        error:
          'Não foi possível executar a varredura das fontes.',
      });
    } finally {
      setLoading(false);
    }
  }

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
        relevantes antes de
        incorporá-los à base
        imobiliária.
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
            Prepare a estrutura que
            permitirá ao Alpha guardar
            permanentemente cada
            empreendimento, bairro,
            documento ou artigo
            descoberto nas fontes.
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
            disabled={setupLoading}
          >
            {setupLoading
              ? 'Preparando fila...'
              : 'Preparar fila de candidatos'}
          </button>

          <small>
            Operação administrativa.
            Não apaga nem altera
            empreendimentos existentes.
          </small>
        </div>
      </section>

      {setupLoading && (
        <section className="setup-loading">
          <div className="scan-pulse" />

          <div>
            <strong>
              Preparando estrutura
            </strong>

            <p>
              O Alpha está verificando
              e criando somente os
              componentes necessários
              para a fila de discovery.
            </p>
          </div>
        </section>
      )}

      {setupData?.ok && (
        <div className="setup-message success">
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
          <div className="setup-message error">
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
            Descubra automaticamente o
            que há de novo no mercado.
          </h2>

          <p>
            A varredura percorre as
            fontes-mãe cadastradas,
            analisa os links internos e
            organiza páginas candidatas.
            Nada é publicado
            automaticamente nesta etapa.
          </p>

          <div className="scan-features">
            <span>
              Imóveis de Alto Padrão Rio
            </span>

            <span>
              Construtoras
            </span>

            <span>
              Empreendimentos
            </span>

            <span>Bairros</span>

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
            disabled={loading}
          >
            {loading
              ? 'Varrendo fontes...'
              : 'Varrer fontes agora'}
          </button>

          <small>
            A varredura pode levar
            alguns segundos porque o
            Alpha visita várias páginas
            das fontes aprovadas.
          </small>
        </div>
      </section>

      {loading && (
        <section className="scan-loading">
          <div className="scan-pulse" />

          <div>
            <strong>
              Analisando inteligência de
              mercado
            </strong>

            <p>
              O Alpha está percorrendo
              as fontes e classificando
              as páginas encontradas.
            </p>
          </div>
        </section>
      )}

      {data &&
        !data.ok && (
          <div className="scan-message error">
            <strong>
              A varredura não foi
              concluída.
            </strong>

            <span>
              {data.error ||
                'Ocorreu um erro inesperado.'}
            </span>
          </div>
        )}

      {data?.ok &&
        data.summary &&
        data.result && (
          <>
            <section className="scan-summary">
              <article>
                <span>
                  Fontes
                </span>

                <strong>
                  {
                    data.summary
                      .sourcesScanned
                  }
                </strong>
              </article>

              <article>
                <span>
                  Páginas descobertas
                </span>

                <strong>
                  {
                    data.summary
                      .totalDiscovered
                  }
                </strong>
              </article>

              <article>
                <span>
                  Empreendimentos
                </span>

                <strong>
                  {
                    data.summary
                      .projects
                  }
                </strong>
              </article>

              <article>
                <span>
                  Bairros
                </span>

                <strong>
                  {
                    data.summary
                      .neighborhoods
                  }
                </strong>
              </article>

              <article>
                <span>
                  Documentos
                </span>

                <strong>
                  {
                    data.summary
                      .documents
                  }
                </strong>
              </article>

              <article>
                <span>
                  Artigos
                </span>

                <strong>
                  {
                    data.summary
                      .articles
                  }
                </strong>
              </article>
            </section>

            <ResultTable
              title="Empreendimentos candidatos"
              description="Páginas com maior probabilidade de representar lançamentos, residenciais ou produtos imobiliários."
              items={
                data.result.projects
              }
            />

            <ResultTable
              title="Bairros e localizações"
              description="Páginas territoriais que poderão alimentar a inteligência local e as páginas premium de bairro."
              items={
                data.result
                  .neighborhoods
              }
            />

            <ResultTable
              title="Documentos"
              description="PDFs e outros materiais encontrados nas fontes e candidatos à ingestão documental."
              items={
                data.result.documents
              }
            />

            <ResultTable
              title="Conteúdo editorial"
              description="Artigos e páginas de mercado que poderão servir como evidência para SEO e inteligência territorial."
              items={
                data.result.articles
              }
            />

            {data.result.errors
              .length > 0 && (
              <section className="scan-errors">
                <div className="eyebrow">
                  Atenção
                </div>

                <h2>
                  Algumas fontes não
                  puderam ser varridas.
                </h2>

                {data.result.errors.map(
                  (error) => (
                    <div
                      key={
                        error.sourceRootUrl
                      }
                      className="scan-error-item"
                    >
                      <strong>
                        {
                          error.sourceRootName
                        }
                      </strong>

                      <span>
                        {
                          error.message
                        }
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
          max-width: 780px;
          color: #5f6a70;
          line-height: 1.75;
        }

        .discovery-setup {
          margin-top: 34px;
          padding: 30px 34px;
          display: grid;
          grid-template-columns:
            1.2fr .8fr;
          gap: 50px;
          align-items: center;
          background: #f7f3ec;
          border:
            1px solid #ded5c8;
        }

        .discovery-setup h2 {
          margin: 0 0 12px;
          font-family:
            Georgia,
            'Times New Roman',
            serif;
          font-size: 32px;
          font-weight: 400;
        }

        .discovery-setup p {
          max-width: 700px;
          margin: 0;
          color: #657075;
          line-height: 1.7;
        }

        .setup-flow {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 9px;
          margin-top: 22px;
        }

        .setup-flow span {
          padding: 8px 10px;
          border:
            1px solid #d7cbb9;
          background: #fff;
          color: #6c5b44;
          font-size: 9px;
          font-weight: 700;
          text-transform:
            uppercase;
          letter-spacing: .1em;
        }

        .setup-flow b {
          color: #b3976d;
        }

        .setup-action {
          display: grid;
          gap: 12px;
        }

        .setup-action button {
          min-height: 58px;
          padding: 0 22px;
          border: 0;
          cursor: pointer;
          background: #1a2b32;
          color: #fff;
          text-transform:
            uppercase;
          letter-spacing: .11em;
          font-size: 10px;
          font-weight: 700;
        }

        .setup-action button:hover:not(
          :disabled
        ) {
          background: #263f49;
        }

        .setup-action button:disabled {
          opacity: .65;
          cursor: wait;
        }

        .setup-action small {
          color: #7c817f;
          line-height: 1.5;
        }

        .setup-loading,
        .scan-loading {
          margin-top: 24px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 18px;
          border:
            1px solid #d8d0c5;
          background: #fff;
        }

        .setup-loading p,
        .scan-loading p {
          margin: 5px 0 0;
          color: #69747a;
        }

        .setup-message {
          margin-top: 20px;
          padding: 18px 22px;
          display: grid;
          gap: 5px;
        }

        .setup-message.success {
          color: #1d603b;
          background: #edf8f1;
          border:
            1px solid #bfdcc9;
        }

        .setup-message.error {
          color: #84362e;
          background: #fff1ee;
          border:
            1px solid #e4beb7;
        }

        .scan-hero {
          margin-top: 28px;
          padding: 42px;
          display: grid;
          grid-template-columns:
            1.2fr .8fr;
          gap: 70px;
          align-items: center;
          background:
            linear-gradient(
              135deg,
              #101a1f,
              #20343c
            );
          color: #fff;
        }

        .scan-hero h2 {
          margin: 0;
          max-width: 720px;
          font-family:
            Georgia,
            'Times New Roman',
            serif;
          font-size:
            clamp(
              34px,
              4vw,
              52px
            );
          line-height: 1.02;
          font-weight: 400;
          letter-spacing: -.03em;
        }

        .scan-hero p {
          max-width: 700px;
          margin: 22px 0;
          color:
            rgba(
              255,
              255,
              255,
              .66
            );
          line-height: 1.75;
        }

        .scan-features {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 26px;
        }

        .scan-features span {
          padding: 8px 10px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .15
            );
          color:
            rgba(
              255,
              255,
              255,
              .72
            );
          font-size: 9px;
          font-weight: 700;
          text-transform:
            uppercase;
          letter-spacing: .1em;
        }

        .scan-action {
          display: grid;
          gap: 14px;
        }

        .scan-action button {
          min-height: 64px;
          padding: 0 24px;
          border: 0;
          background: #b3976d;
          color: #fff;
          cursor: pointer;
          text-transform:
            uppercase;
          letter-spacing: .12em;
          font-weight: 700;
          font-size: 11px;
          transition: .2s ease;
        }

        .scan-action button:hover:not(
          :disabled
        ) {
          background: #c4a87e;
        }

        .scan-action button:disabled {
          opacity: .7;
          cursor: wait;
        }

        .scan-action small {
          color:
            rgba(
              255,
              255,
              255,
              .5
            );
          line-height: 1.6;
        }

        .scan-pulse {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: #b3976d;
          box-shadow:
            0 0 0
            rgba(
              179,
              151,
              109,
              .5
            );
          animation:
            sourcePulse
            1.4s infinite;
        }

        @keyframes sourcePulse {
          0% {
            box-shadow:
              0 0 0 0
              rgba(
                179,
                151,
                109,
                .5
              );
          }

          70% {
            box-shadow:
              0 0 0 14px
              rgba(
                179,
                151,
                109,
                0
              );
          }

          100% {
            box-shadow:
              0 0 0 0
              rgba(
                179,
                151,
                109,
                0
              );
          }
        }

        .scan-message {
          margin-top: 24px;
          padding: 20px 24px;
          display: grid;
          gap: 6px;
        }

        .scan-message.error {
          color: #84362e;
          background: #fff1ee;
          border:
            1px solid #e4beb7;
        }

        .scan-summary {
          margin-top: 28px;
          display: grid;
          grid-template-columns:
            repeat(
              6,
              minmax(0, 1fr)
            );
          gap: 10px;
        }

        .scan-summary article {
          padding: 22px 18px;
          background: #fff;
          border:
            1px solid #ded8cf;
          display: grid;
          gap: 8px;
        }

        .scan-summary span {
          font-size: 9px;
          text-transform:
            uppercase;
          letter-spacing: .1em;
          color: #798287;
        }

        .scan-summary strong {
          font-family:
            Georgia,
            'Times New Roman',
            serif;
          font-size: 34px;
          font-weight: 400;
        }

        .sources-result {
          margin-top: 28px;
          padding: 30px;
          background: #fff;
          border:
            1px solid #ded8cf;
        }

        .sources-result-head {
          display: grid;
          grid-template-columns:
            1fr auto;
          gap: 30px;
          align-items: end;
          margin-bottom: 26px;
        }

        .sources-result-head h2 {
          margin: 0 0 8px;
          font-family:
            Georgia,
            'Times New Roman',
            serif;
          font-size: 30px;
          font-weight: 400;
        }

        .sources-result-head p {
          margin: 0;
          max-width: 720px;
          color: #6a757a;
          line-height: 1.65;
        }

        .sources-result-head
          > strong {
          font-family:
            Georgia,
            'Times New Roman',
            serif;
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
          max-width: 620px;
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
          border:
            1px solid #d6d0c8;
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
          border:
            1px dashed #d5cec4;
          color: #747e83;
        }

        .scan-errors {
          margin-top: 28px;
          padding: 28px;
          color: #7d3c33;
          background: #fff3f0;
          border:
            1px solid #e5c5be;
        }

        .scan-errors h2 {
          margin: 0 0 20px;
        }

        .scan-error-item {
          padding: 14px 0;
          display: grid;
          gap: 5px;
          border-top:
            1px solid
            rgba(
              125,
              60,
              51,
              .14
            );
        }

        @media (
          max-width: 1050px
        ) {
          .scan-summary {
            grid-template-columns:
              repeat(
                3,
                1fr
              );
          }
        }

        @media (
          max-width: 800px
        ) {
          .discovery-setup,
          .scan-hero {
            grid-template-columns:
              1fr;
            gap: 32px;
            padding: 26px;
          }

          .scan-summary {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .sources-result {
            padding: 20px;
          }

          .sources-result-head {
            grid-template-columns:
              1fr;
          }
        }
      `}</style>
    </>
  );
}
