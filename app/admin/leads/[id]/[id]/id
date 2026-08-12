'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const activityTypes = [
  { value: 'NOTE', label: 'Nota' },
  { value: 'CALL', label: 'Ligação' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'VISIT', label: 'Visita' },
  { value: 'TASK', label: 'Tarefa' },
];

export function ActivityForm({ leadId }: { leadId: string }) {
  const router = useRouter();

  const [type, setType] = useState('NOTE');
  const [note, setNote] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(
        `/api/admin/leads/${leadId}/activities`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            note: note.trim() || undefined,
            dueAt: dueAt || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Não foi possível registrar a atividade.',
        );
      }

      setNote('');
      setDueAt('');
      setMessage('Atividade registrada com sucesso.');

      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Erro inesperado ao registrar a atividade.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="quiz" onSubmit={submit}>
      <div className="quiz-block">
        <label htmlFor="activity-type">Tipo de atividade</label>

        <select
          id="activity-type"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          {activityTypes.map((activityType) => (
            <option
              key={activityType.value}
              value={activityType.value}
            >
              {activityType.label}
            </option>
          ))}
        </select>
      </div>

      <div className="quiz-block">
        <label htmlFor="activity-note">
          Observação
        </label>

        <textarea
          id="activity-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Ex.: cliente pediu retorno amanhã pela manhã."
        />
      </div>

      <div className="quiz-block">
        <label htmlFor="activity-due">
          Prazo ou data do próximo contato
        </label>

        <input
          id="activity-due"
          type="datetime-local"
          value={dueAt}
          onChange={(event) => setDueAt(event.target.value)}
        />
      </div>

      <button
        className="btn"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Salvando...' : 'Registrar atividade'}
      </button>

      {message && (
        <p role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
