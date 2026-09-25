'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { alphaPath } from '@/lib/public-path';

type Assignee = { id: string; name: string | null; email: string };

export function AssignmentForm({
  leadId,
  assignedToId,
  assignees,
}: {
  leadId: string;
  assignedToId: string | null;
  assignees: Assignee[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(assignedToId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(alphaPath(`/api/admin/leads/${leadId}/assignment`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: selected || null }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Não foi possível atribuir o lead.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao atribuir o lead.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="quiz-block">
      <label htmlFor="lead-assignee">Responsável pelo atendimento</label>
      <select
        id="lead-assignee"
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
      >
        <option value="">Sem responsável: disponível para distribuição</option>
        {assignees.map((assignee) => (
          <option key={assignee.id} value={assignee.id}>
            {assignee.name || assignee.email} ({assignee.email})
          </option>
        ))}
      </select>
      <button
        className="btn"
        disabled={saving || selected === (assignedToId ?? '')}
        onClick={save}
        type="button"
      >
        {saving ? 'Salvando...' : 'Atribuir ou transferir'}
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
