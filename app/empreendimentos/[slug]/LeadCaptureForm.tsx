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
          data.error || 'Não foi possível enviar sua solicitação.',
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
        `Sua solicitação sobre ${projectName} foi recebida. Nossa equipe fará o contato de forma reservada.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível concluir sua solicitação neste momento.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="quiz concierge-form" onSubmit={submit}>
      <div className="concierge-form-intro">
        <span>Solicitação de atendimento</span>
        <p>
          Preencha seus dados para receber informações comerciais e
          disponibilidade deste empreendimento.
        </p>
      </div>

      <div className="quiz-block">
        <label htmlFor="lead-name">Nome</label>

        <input
          id="lead-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          placeholder="Seu nome"
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
          placeholder="Seu contato preferencial"
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
          placeholder="Seu e-mail"
        />
      </div>

      <div className="quiz-block">
        <label htmlFor="lead-objective">Interesse principal</label>

        <select
          id="lead-objective"
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
        >
          <option value="LIVE">Residência</option>
          <option value="INVEST">Investimento</option>
          <option value="PATRIMONY">Patrimônio</option>
          <option value="OTHER">Outro perfil</option>
        </select>
      </div>

      <div className="quiz-block">
        <label htmlFor="lead-budget">
          Faixa de investimento
        </label>

        <input
          id="lead-budget"
          inputMode="numeric"
          value={budgetMax}
          onChange={(event) =>
            setBudgetMax(event.target.value.replace(/\D/g, ''))
          }
          placeholder="Valor máximo previsto"
        />
      </div>

      <div className="quiz-block">
        <label htmlFor="lead-message">
          Como podemos ajudar?
        </label>

        <textarea
          id="lead-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={2000}
          rows={5}
          placeholder={`Gostaria de receber informações reservadas sobre ${projectName}.`}
        />
      </div>

      <div className="quiz-block concierge-consent">
        <label>
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            required
          />{' '}
          Autorizo o contato da equipe para este atendimento.
        </label>
      </div>

      <button className="btn concierge-submit" type="submit" disabled={loading}>
        {loading ? 'Enviando solicitação...' : 'Solicitar atendimento'}
      </button>

      <div className="concierge-privacy-note">
        Seus dados serão utilizados exclusivamente para este atendimento.
      </div>

      {success && (
        <p className="concierge-success" role="status">
          {success}
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
