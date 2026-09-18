'use client';

import { alphaPath } from '@/lib/public-path';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type WhatsAppFollowUpActionsProps = {
  activityId: string;
  href: string;
};

export function WhatsAppFollowUpActions({ activityId, href }: WhatsAppFollowUpActionsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function markAsSent() {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(alphaPath(`/api/admin/lead-activities/${activityId}/complete`, {
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
      <a className="btn" href={href} rel="noreferrer" target="_blank">
        Preparar mensagem
      </a>{' '}
      <button className="btn" disabled={saving} onClick={markAsSent} type="button">
        {saving ? 'Registrando...' : 'Marcar enviado'}
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
