'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { photoPriorityOptions } from '@/lib/media-priority';
import { alphaPath } from '@/lib/public-path';

export function PhotoPrioritySelect({ id, position }: { id: string; position: number }) {
  const router = useRouter();
  const [current, setCurrent] = useState(position);
  const [status, setStatus] = useState('');

  async function update(nextPosition: number) {
    setStatus('Salvando...');
    try {
      const response = await fetch(alphaPath(`/api/admin/media/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: nextPosition }),
      });
      if (!response.ok) throw new Error('Não foi possível alterar a prioridade.');
      setCurrent(nextPosition);
      setStatus('Prioridade salva.');
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erro ao alterar a prioridade.');
    }
  }

  return (
    <span>
      <select
        aria-label="Prioridade da foto"
        value={current}
        onChange={(event) => void update(Number(event.target.value))}
      >
        {!photoPriorityOptions.some((option) => option.value === current) && (
          <option value={current}>Ordem anterior ({current})</option>
        )}
        {photoPriorityOptions.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>{' '}
      <small role="status">{status}</small>
    </span>
  );
}
