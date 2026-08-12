'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import type { Project } from '@/lib/projects';

type SearchProps = {
  projects: Project[];
  initialQuery?: string;
  initialNeighborhood?: string;
};

export function Search({
  projects,
  initialQuery = '',
  initialNeighborhood = '',
}: SearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [neighborhood, setNeighborhood] = useState(initialNeighborhood);

  const neighborhoods = [
    ...new Set(projects.map((project) => project.neighborhood)),
  ].sort();

  const list = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return projects.filter((project) => {
      const searchableText = [
        project.name,
        project.description,
        project.neighborhood,
        ...project.types,
        ...project.highlights,
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery =
        !normalizedQuery || searchableText.includes(normalizedQuery);

      const matchesNeighborhood =
        !neighborhood || project.neighborhood === neighborhood;

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
          onChange={(event) => setQuery(event.target.value)}
        />

        <label htmlFor="search-neighborhood">
          Bairro
        </label>

        <select
          id="search-neighborhood"
          value={neighborhood}
          onChange={(event) => setNeighborhood(event.target.value)}
        >
          <option value="">Todos os bairros</option>

          {neighborhoods.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div aria-live="polite">
          {list.length}{' '}
          {list.length === 1 ? 'resultado' : 'resultados'}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="notice">
          Nenhum empreendimento encontrado com esses filtros.
        </div>
      ) : (
        <div className="grid">
          {list.map((project) => (
            <Card key={project.slug} p={project} />
          ))}
        </div>
      )}
    </>
  );
}
