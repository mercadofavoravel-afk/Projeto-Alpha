'use client';

import { FormEvent, useState } from 'react';

type LeadCaptureFormProps = {
  projectName: string;
  projectSlug: string;
  neighborhood: string;
};

function getSessionKey() {
  let key = localStorage.getItem('alpha_session_key');

  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem('alpha_session_key', key);
  }

  return key;
}

export function LeadCaptureForm({
  projectName,
  projectSlug,
  neighborhood,
}: LeadCaptureFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [objective, setObjective] = useState('LIVE');
  const [budgetMax, setBudgetMax] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const params = new URLSearchParams(window.location.search);
      const sessionKey = getSessionKey();

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          objective,
          neighborhood,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
          message: message.trim() || undefined,
          source: `empreendimento:${projectSlug}`.slice(0, 120),
          utmSource: params.get('utm_source') || undefined,
          utmMedium: params.get('utm_medium') || undefined,
          utmCampaign: params.get('utm_campaign') || undefined,
          consent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Não foi possível enviar seus dados.',
        );
      }

      void fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        keepalive: true,
        body: JSON.stringify({
          name: 'lead_submitted',
          path: window.location.pathname,
          sessionKey,
          metadata: {
            leadId: data.leadId,
            projectSlug,
            neighborhood,
            objective,
            utmSource: params.get('utm_source') || undefined,
            utmMedium: params.get('utm_medium') || undefined,
            utmCampaign: params.get('utm_campaign') || undefined,
          },
        }),
      }).catch(() => undefined);

      setName('');
      setPhone('');
      setEmail('');
      setBudgetMax('');
      setMessage('');
      setConsent(false);

      setSuccess(
        `Recebemos seu interesse em ${projectName}. Nossa equipe poderá entrar em contato com você.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Erro inesperado ao enviar seus dados.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="quiz" onSubmit={submit}>
      <div className="quiz-block">
        <label htmlFor="lead-name">Nome</label>

        <input
          id="lead-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
        />
      </div>

      <div className="quiz-block">
        <label htmlFor="lead-phone">Telefone / WhatsApp</label>

        <input
          id="lead-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          required
          minLength={8}
          maxLength={30}
        />
      </div>

      <div className="quiz-block">
        <label htmlFor="lead-email">E-mail</label>

        <input
          id="lead-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </div>

      <div className="quiz-block">
        <label htmlFor="lead-objective">Objetivo</label>

        <select
          id="lead-objective"
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
        >
          <option value="LIVE">Morar</option>
          <option value="INVEST">Investir</option>
          <option value="PATRIMONY">Patrimônio</option>
          <option value="OTHER">Outro</option>
        </select>
      </div>

      <div className="quiz-block">
        <label htmlFor="lead-budget">Orçamento máximo</label>

        <input
          id="lead-budget"
          inputMode="numeric"
          value={budgetMax}
          onChange={(event) =>
            setBudgetMax(event.target.value.replace(/\D/g, ''))
          }
          placeholder="Ex.: 3000000"
        />
      </div>

      <div className="quiz-block">
        <label htmlFor="lead-message">Mensagem</label>

        <textarea
          id="lead-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={2000}
          rows={5}
          placeholder={`Quero receber mais informações sobre ${projectName}.`}
        />
      </div>

      <div className="quiz-block">
        <label>
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            required
          />{' '}
          Autorizo o contato da equipe sobre este empreendimento.
        </label>
      </div>

      <button className="btn" type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Quero receber informações'}
      </button>

      {success && <p role="status">{success}</p>}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
