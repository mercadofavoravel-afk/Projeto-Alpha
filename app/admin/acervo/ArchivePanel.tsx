'use client';

import { useState } from 'react';
import { archiveKinds, archiveOrganizationLabel } from '@/lib/commercial-archive-labels';
import { organizeArchiveItem } from './actions';

export type ArchiveRow = {
  id: string;
  title: string;
  kind: string;
  organization: string | null;
  organizationKind: string;
  projectName: string | null;
  url: string | null;
  fileName: string | null;
  sizeBytes: number | null;
  status: string;
  origin: string;
  notes: string | null;
};

export function ArchivePanel({ items }: { items: ArchiveRow[] }) {
  const [search, setSearch] = useState('');
  const [organization, setOrganization] = useState('');
  const [kind, setKind] = useState('');
  const labels = [...new Set(items.map(archiveOrganizationLabel))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const filtered = items.filter(
    (item) =>
      (!kind || item.kind === kind) &&
      (!organization || archiveOrganizationLabel(item) === organization) &&
      normalize(
        [item.title, item.organization, item.projectName, item.fileName, item.url].join(' '),
      ).includes(normalize(search)),
  );
  return (
    <>
      <div className="panel">
        <p>
          <strong>{items.length}</strong> links e pastas · <strong>{labels.length}</strong> grupos
        </p>
        <div className="form-grid">
          <label>
            Buscar
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Empreendimento, incorporadora ou arquivo"
            />
          </label>
          <label>
            Incorporadora ou origem
            <select value={organization} onChange={(e) => setOrganization(e.target.value)}>
              <option value="">Todos os grupos</option>
              {labels.map((label) => (
                <option key={label}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Material
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">Todos os materiais</option>
              {Object.entries(archiveKinds).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p aria-live="polite">{filtered.length} itens encontrados</p>
      </div>
      {labels
        .filter((label) => filtered.some((item) => archiveOrganizationLabel(item) === label))
        .map((label) => (
          <section key={label} className="panel">
            <h2>{label}</h2>
            {filtered
              .filter((item) => archiveOrganizationLabel(item) === label)
              .map((item) => (
                <article
                  key={item.id}
                  style={{
                    borderTop: '1px solid #ddd',
                    padding: '18px 0',
                    overflowWrap: 'anywhere',
                  }}
                >
                  <h3>{item.title}</h3>
                  <p>
                    {archiveKinds[item.kind as keyof typeof archiveKinds] ?? item.kind}
                    {item.projectName ? ` · ${item.projectName}` : ''}
                  </p>
                  {item.url && (
                    <p>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        Abrir {item.kind === 'LINK' ? 'link ou pasta' : 'fonte do documento'} ↗
                      </a>
                    </p>
                  )}
                  <p>Acesso e download diretamente na origem</p>
                  {item.fileName && (
                    <p>
                      {item.fileName}
                      {item.sizeBytes ? ` · ${(item.sizeBytes / 1048576).toFixed(1)} MB` : ''}
                    </p>
                  )}
                  {item.notes && <p>{item.notes}</p>}
                  <small>Origem: {item.origin}</small>
                  <details>
                    <summary>Organizar incorporadora e empreendimento</summary>
                    <form action={organizeArchiveItem} className="form-grid">
                      <input type="hidden" name="id" value={item.id} />
                      <label>
                        Incorporadora ou imobiliária
                        <input
                          name="organization"
                          defaultValue={item.organization ?? ''}
                          maxLength={200}
                        />
                      </label>
                      <label>
                        Empreendimento
                        <input
                          name="projectName"
                          defaultValue={item.projectName ?? ''}
                          maxLength={200}
                        />
                      </label>
                      <button type="submit">Salvar organização</button>
                    </form>
                  </details>
                </article>
              ))}
          </section>
        ))}
      {filtered.length === 0 && <p>Nenhum item corresponde aos filtros.</p>}
    </>
  );
}
