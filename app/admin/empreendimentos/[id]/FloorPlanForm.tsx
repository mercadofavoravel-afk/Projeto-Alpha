'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { alphaPath } from '@/lib/public-path';

export function FloorPlanForm({
  projectId,
  kind = 'FLOOR_PLAN',
}: {
  projectId: string;
  kind?: 'FLOOR_PLAN' | 'IMAGE';
}) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState('');
  const isImage = kind === 'IMAGE';
  const label = isImage ? 'foto' : 'planta';

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(`Salvando ${label}...`);

    try {
      const response = await fetch(alphaPath('/api/admin/media'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, kind, url, caption }),
      });

      if (!response.ok) throw new Error(`Não foi possível cadastrar a ${label}.`);
      setUrl('');
      setCaption('');
      setStatus(`${isImage ? 'Foto cadastrada' : 'Planta cadastrada'}.`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `Erro ao cadastrar a ${label}.`);
    }
  }

  return (
    <form className="editor-form" onSubmit={save}>
      <div className="editor-grid">
        <label>
          URL pública da {label}
          <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} required />
        </label>
        <label>
          {isImage ? 'Descrição da foto' : 'Nome da planta'}
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={500}
            placeholder={
              isImage ? 'Ex.: Fachada do empreendimento' : 'Ex.: Apartamento de 2 quartos'
            }
          />
        </label>
      </div>
      <button className="btn" type="submit">
        Cadastrar {label}
      </button>
      <span role="status">{status}</span>
    </form>
  );
}
