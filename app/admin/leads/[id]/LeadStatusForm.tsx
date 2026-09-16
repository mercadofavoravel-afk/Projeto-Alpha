'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const statusOptions = [
  { value: 'NEW', label: 'Novo' },
  { value: 'CONTACTED', label: 'Em atendimento' },
  { value: 'QUALIFIED', label: 'Qualificado' },
  { value: 'VISIT_SCHEDULED', label: 'Visita agendada' },
  { value: 'WON', label: 'Fechado' },
  { value: 'LOST', label: 'Encerrado ou descadastrado' },
];

type LeadStatusFormProps = {
  leadId: string;
  initialStatus: string;
};

export function LeadStatusForm({ leadId, initialStatus }: LeadStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function saveStatus() {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível atualizar o atendimento.');
      }

      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível atualizar o atendimento.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="quiz-block">
      <label htmlFor="lead-status">Status do atendimento</label>

      <select
        id="lead-status"
        onChange={(event) => setStatus(event.target.value)}
        value={status}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <p>
        Ao sair de “Novo”, os follow-ups programados são encerrados para evitar mensagens
        indevidas.
      </p>

      <button className="btn" disabled={saving} onClick={saveStatus} type="button">
        {saving ? 'Atualizando...' : 'Atualizar atendimento'}
      </button>

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
