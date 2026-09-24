'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { alphaPath } from '@/lib/public-path';

export function FloorPlanForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState('');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Salvando planta...');

    try {
      const response = await fetch(alphaPath('/api/admin/media'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, kind: 'FLOOR_PLAN', url, caption }),
      });

      if (!response.ok) throw new Error('Não foi possível cadastrar a planta.');
      setUrl('');
      setCaption('');
      setStatus('Planta cadastrada.');
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erro ao cadastrar a planta.');
    }
  }

  return (
    <form className="editor-form" onSubmit={save}>
      <div className="editor-grid">
        <label>
          URL pública da planta
          <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} required />
        </label>
        <label>
          Nome da planta
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={500}
            placeholder="Ex.: Apartamento de 2 quartos"
          />
        </label>
      </div>
      <button className="btn" type="submit">
        Cadastrar planta
      </button>
      <span role="status">{status}</span>
    </form>
  );
}
