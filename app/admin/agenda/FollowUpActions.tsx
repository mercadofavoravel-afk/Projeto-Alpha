'use client';

import { alphaPath } from '@/lib/public-path';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FollowUpActionsProps = {
  activityId: string;
  href?: string;
  leadHref: string;
};

export function FollowUpActions({ activityId, href, leadHref }: FollowUpActionsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function markAsCompleted() {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(alphaPath(`/api/admin/lead-activities/${activityId}/complete`), {
        method: 'PATCH',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível atualizar o acompanhamento.');
      }

      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível atualizar o acompanhamento.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {href ? (
        <a className="btn" href={href} rel="noreferrer" target="_blank">
          Preparar mensagem
        </a>
      ) : (
        <a className="btn" href={leadHref}>
          Abrir lead
        </a>
      )}{' '}
      <button className="btn" disabled={saving} onClick={markAsCompleted} type="button">
        {saving ? 'Registrando...' : 'Concluir acompanhamento'}
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
