'use client';
import { useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import type { Project } from '@/lib/projects';
export function Search({ projects }: { projects: Project[] }) {
  const [q, setQ] = useState('');
  const [b, setB] = useState('');
  const bairros = [...new Set(projects.map((p) => p.neighborhood))].sort();
  const list = useMemo(
    () =>
      projects.filter(
        (p) =>
          (!q || `${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase())) &&
          (!b || p.neighborhood === b),
      ),
    [q, b, projects],
  );
  return (
    <>
      <div className="filters">
        <input
          placeholder="Nome ou palavra-chave"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={b} onChange={(e) => setB(e.target.value)}>
          <option value="">Todos os bairros</option>
          {bairros.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <div>{list.length} resultados</div>
      </div>
      <div className="grid">
        {list.map((p) => (
          <Card key={p.slug} p={p} />
        ))}
      </div>
    </>
  );
}
