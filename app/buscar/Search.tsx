'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/Card';

export type SearchProject = {
  slug: string;
  name: string;
  description: string;
  neighborhood: string;
  image: string;
  status: string;
  objectives: string[];
  types: string[];
  collections: string[];
  highlights: string[];
};

type SearchProps = {
  projects: SearchProject[];
  initialQuery?: string;
  initialNeighborhood?: string;
};

export function Search({
  projects,
  initialQuery = '',
  initialNeighborhood = '',
}: SearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [neighborhood, setNeighborhood] = useState(
    initialNeighborhood,
  );

  const neighborhoods = [
    ...new Set(
      projects.map((project) => project.neighborhood),
    ),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const list = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLocaleLowerCase('pt-BR');

    return projects.filter((project) => {
      const searchableText = [
        project.name,
        project.description,
        project.neighborhood,
        ...project.types,
        ...project.collections,
        ...project.highlights,
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR');

      const matchesQuery =
        !normalizedQuery ||
        searchableText.includes(normalizedQuery);

      const matchesNeighborhood =
        !neighborhood ||
        project.neighborhood === neighborhood;

      return matchesQuery && matchesNeighborhood;
    });
  }, [query, neighborhood, projects]);

  return (
    <>
      <div className="filters">
        <label htmlFor="search-query">
          Buscar imóvel
        </label>

        <input
          id="search-query"
          type="search"
          placeholder="Nome, bairro ou palavra-chave"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
        />

        <label htmlFor="search-neighborhood">
          Bairro
        </label>

        <select
          id="search-neighborhood"
          value={neighborhood}
          onChange={(event) =>
            setNeighborhood(event.target.value)
          }
        >
          <option value="">
            Todos os bairros
          </option>

          {neighborhoods.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        <div aria-live="polite">
          {list.length}{' '}
          {list.length === 1
            ? 'resultado'
            : 'resultados'}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="notice">
          Nenhum empreendimento encontrado com esses
          filtros.
        </div>
      ) : (
        <div className="grid">
          {list.map((project) => (
            <Card
              key={project.slug}
              p={project}
            />
          ))}
        </div>
      )}
    </>
  );
}
