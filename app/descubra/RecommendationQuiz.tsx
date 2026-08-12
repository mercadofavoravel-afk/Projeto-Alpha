'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

type RecommendationResult = {
  id: string;
  slug: string;
  name: string;
  neighborhood: string;
  description: string;
  heroImage?: string | null;
  score: number;
  reasons: string[];
};

const bairros = ['Ipanema', 'Leblon', 'Copacabana', 'Barra da Tijuca'];

const tipos = [
  'Studio',
  'Apartamento',
  'Garden',
  'Cobertura',
  'Duplex',
];

function getSessionKey() {
  let key = localStorage.getItem('alpha_session_key');

  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem('alpha_session_key', key);
  }

  return key;
}

function ResultMedia({
  image,
  name,
}: {
  image: string | null | undefined;
  name: string;
}) {
  if (!image) {
    return null;
  }

  if (image.startsWith('/')) {
    return (
      <Image
        src={image}
        alt={name}
        width={900}
        height={560}
        sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 33vw"
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      style={{
        width: '100%',
        height: 280,
        backgroundImage: `url(${JSON.stringify(image)})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    />
  );
}

export function RecommendationQuiz() {
  const [objective, setObjective] = useState('LIVE');
  const [selectedBairros, setSelectedBairros] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [beach, setBeach] = useState(3);
  const [invest, setInvest] = useState(2);
  const [life, setLife] = useState(3);
  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggle(
    value: string,
    current: string[],
    setter: (values: string[]) => void,
  ) {
    setter(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          objective,
          preferredBairros: selectedBairros,
          preferredTypes: selectedTypes,
          budgetMax: budget ? Number(budget) : undefined,
          proximityBeach: beach,
          proximityMetro: 0,
          investmentFocus: invest,
          lifestyleFocus: life,
          sessionKey: getSessionKey(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha na recomendação');
      }

      setResults(data.results ?? []);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Erro inesperado',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className="quiz" onSubmit={submit}>
        <div className="quiz-block">
          <label htmlFor="recommendation-objective">Objetivo</label>

          <select
            id="recommendation-objective"
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
          >
            <option value="LIVE">Morar</option>
            <option value="INVEST">Investir</option>
            <option value="PATRIMONY">Patrimônio</option>
          </select>
        </div>

        <div className="quiz-block">
          <label>Bairros preferidos</label>

          <div className="choice-grid">
            {bairros.map((bairro) => (
              <button
                type="button"
                className={
                  selectedBairros.includes(bairro)
                    ? 'choice active'
                    : 'choice'
                }
                onClick={() =>
                  toggle(
                    bairro,
                    selectedBairros,
                    setSelectedBairros,
                  )
                }
                aria-pressed={selectedBairros.includes(bairro)}
                key={bairro}
              >
                {bairro}
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-block">
          <label>Tipologias</label>

          <div className="choice-grid">
            {tipos.map((tipo) => (
              <button
                type="button"
                className={
                  selectedTypes.includes(tipo)
                    ? 'choice active'
                    : 'choice'
                }
                onClick={() =>
                  toggle(tipo, selectedTypes, setSelectedTypes)
                }
                aria-pressed={selectedTypes.includes(tipo)}
                key={tipo}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-block">
          <label htmlFor="recommendation-budget">
            Orçamento máximo
          </label>

          <input
            id="recommendation-budget"
            inputMode="numeric"
            value={budget}
            onChange={(event) =>
              setBudget(event.target.value.replace(/\D/g, ''))
            }
            placeholder="Ex.: 3000000"
          />
        </div>

        <div className="quiz-block">
          <label htmlFor="recommendation-beach">
            Proximidade da praia: {beach}/5
          </label>

          <input
            id="recommendation-beach"
            type="range"
            min="0"
            max="5"
            value={beach}
            onChange={(event) =>
              setBeach(Number(event.target.value))
            }
          />
        </div>

        <div className="quiz-block">
          <label htmlFor="recommendation-invest">
            Foco em investimento: {invest}/5
          </label>

          <input
            id="recommendation-invest"
            type="range"
            min="0"
            max="5"
            value={invest}
            onChange={(event) =>
              setInvest(Number(event.target.value))
            }
          />
        </div>

        <div className="quiz-block">
          <label htmlFor="recommendation-life">
            Estilo de vida: {life}/5
          </label>

          <input
            id="recommendation-life"
            type="range"
            min="0"
            max="5"
            value={life}
            onChange={(event) =>
              setLife(Number(event.target.value))
            }
          />
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Analisando...' : 'Gerar seleção'}
        </button>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>

      {results.length > 0 && (
        <section
          className="recommendation-results"
          aria-live="polite"
        >
          <div className="head">
            <div>
              <div className="eyebrow">
                Seleção personalizada
              </div>
              <h2>Maior aderência ao perfil.</h2>
            </div>

            <p>
              Ranking indicativo, sujeito à validação comercial.
            </p>
          </div>

          <div className="grid">
            {results.map((project, index) => (
              <article className="card" key={project.id}>
                <ResultMedia
                  image={project.heroImage}
                  name={project.name}
                />

                <div className="copy">
                  <div className="recommendation-rank">
                    #{index + 1} · {project.score} pontos
                  </div>

                  <div className="eyebrow">
                    {project.neighborhood}
                  </div>

                  <h3>{project.name}</h3>
                  <p>{project.description}</p>

                  <div className="reason-list">
                    {project.reasons.map((reason) => (
                      <span key={reason}>{reason}</span>
                    ))}
                  </div>

                  <Link
                    className="btn"
                    href={`/empreendimentos/${project.slug}`}
                  >
                    Conhecer
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
