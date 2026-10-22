'use client';

import { useCallback, useEffect, useState } from 'react';
import { alphaPath } from '@/lib/public-path';
import { DEFAULT_SHIFTS, MAX_SHIFTS, type ShiftSchedule } from '@/lib/roulette-rules';

type Entry = {
  id: string;
  mine: boolean;
  name: string;
  position: number | null;
  checkedOut: boolean;
  online: boolean;
};
type Queue = {
  id: string;
  name: string;
  enabled: boolean;
  regions: string[];
  shifts: ShiftSchedule;
  pending: number | null;
  current: { startsAt: string; endsAt: string } | null;
  registration: { startsAt: string; endsAt: string; name: string } | null;
  sessions: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
    drawnAt: string | null;
    nextPosition: number;
    entries: Entry[];
  }[];
};
type State = { canManage: boolean; canReceive: boolean; queues: Queue[] };
const time = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
const minute = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
const date = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export function RoulettePanel() {
  const [state, setState] = useState<State | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | undefined>();
  const [name, setName] = useState('Plantão geral');
  const [regions, setRegions] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [shifts, setShifts] = useState<ShiftSchedule>(DEFAULT_SHIFTS);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch(alphaPath('/api/admin/roleta'), { cache: 'no-store' });
      if (!response.ok) {
        setMessage('Não foi possível carregar a roleta. Confira sua sessão.');
        return;
      }
      setState(await response.json());
    } catch {
      setMessage('Conexão indisponível. Sua participação não foi confirmada.');
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  async function send(payload: unknown) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(alphaPath('/api/admin/roleta'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      setMessage(
        response.ok
          ? result.warning || 'Alteração registrada.'
          : result.error || 'Não foi possível concluir.',
      );
      if (response.ok) await refresh();
    } catch {
      setMessage('Falha de conexão. Atualize para conferir o resultado antes de tentar novamente.');
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    setEditing(undefined);
    setName('');
    setRegions('');
    setEnabled(true);
    setShifts(DEFAULT_SHIFTS);
  }
  if (!state)
    return (
      <section className="panel">
        <p role="status">{message || 'Carregando plantões…'}</p>
      </section>
    );
  return (
    <>
      <section className="panel">
        <h2>Como participar</h2>
        <p>
          Faça check-in em cada plantão. As inscrições abrem 30 minutos antes. A ordem é sorteada
          uma vez no início; entradas posteriores vão para o fim. Sair e voltar mantém sua posição.
        </p>
        <p>
          Mantenha o CRM aberto e visível para permanecer online. Após três minutos sem conexão ou
          com o painel em segundo plano, você deixa de receber até voltar. É possível acessar de
          dentro ou fora da empresa.
        </p>
        <p>
          O rodízio respeita bairros, disponibilidade e limite de leads. No intervalo entre turnos
          ou sem participante elegível, os contatos ficam aguardando. Todos os horários são de
          Brasília.
        </p>
        {!state.canReceive && (
          <p className="notice">
            Seu recebimento está desabilitado. A gestão precisa habilitá-lo para você participar.
          </p>
        )}
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
      </section>
      {state.queues.length === 0 && (
        <section className="panel">
          <p>
            Nenhuma roleta configurada. A direção pode criar uma fila geral ou por bairros abaixo.
          </p>
        </section>
      )}
      {state.queues.map((queue) => (
        <section className="panel" key={queue.id}>
          <h2>
            {queue.name} · {queue.enabled ? 'Ativa' : 'Pausada'}
          </h2>
          <p>{queue.regions.length ? queue.regions.join(', ') : 'Fila geral — todos os bairros'}</p>
          <p>
            {queue.shifts
              .map(
                (s) =>
                  `${s.name}: ${time(s.start)}–${time(s.end)}${s.end <= s.start ? ' do dia seguinte' : ''}`,
              )
              .join(' · ')}
          </p>
          <p>
            {queue.current
              ? `Plantão em andamento até ${date(queue.current.endsAt)}.`
              : 'Intervalo entre plantões.'}
            {queue.pending !== null && ` ${queue.pending} lead(s) aguardando nesta fila.`}
          </p>
          <div className="button-row">
            <button
              className="btn"
              disabled={busy || !queue.enabled || !state.canReceive || !queue.registration}
              onClick={() => void send({ action: 'checkin', id: queue.id })}
            >
              {queue.registration ? `Check-in: ${queue.registration.name}` : 'Check-in fechado'}
            </button>
            <button
              className="btn secondary"
              disabled={busy}
              onClick={() => void send({ action: 'checkout', id: queue.id })}
            >
              Sair dos plantões desta fila
            </button>
            {state.canManage && (
              <button
                className="btn secondary"
                disabled={busy}
                onClick={() => {
                  setEditing(queue.id);
                  setName(queue.name);
                  setRegions(queue.regions.join(', '));
                  setEnabled(queue.enabled);
                  setShifts(queue.shifts);
                }}
              >
                Editar fila
              </button>
            )}
          </div>
          {queue.sessions.map((shift) => (
            <div key={shift.id}>
              <h3>
                {shift.name} · {date(shift.startsAt)} até {date(shift.endsAt)}
              </h3>
              <p>
                {shift.drawnAt
                  ? `Sorteio registrado em ${date(shift.drawnAt)}. O recebimento segue em rodízio entre os participantes elegíveis.`
                  : 'Inscrições abertas; sorteio ainda não realizado.'}
              </p>
              {shift.entries.length === 0 ? (
                <p>Nenhuma participação visível neste plantão.</p>
              ) : (
                <ol>
                  {shift.entries.map((entry) => (
                    <li key={entry.id}>
                      {entry.position === null
                        ? 'Aguardando sorteio'
                        : `Posição ${entry.position + 1}`}{' '}
                      · {entry.name}
                      {entry.mine ? ' (você)' : ''} ·{' '}
                      {entry.checkedOut
                        ? 'Saiu do plantão'
                        : entry.online
                          ? 'Online'
                          : 'Sem presença recente'}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </section>
      ))}
      {state.canManage && (
        <section className="panel">
          <h2>{editing ? 'Editar fila' : 'Criar fila de plantão'}</h2>
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void send({
                action: 'save',
                id: editing,
                queue: {
                  name,
                  regions: regions
                    .split(',')
                    .map((r) => r.trim())
                    .filter(Boolean),
                  enabled,
                  shifts,
                },
              });
            }}
          >
            <label>
              Nome da fila
              <input
                required
                minLength={3}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Bairros, separados por vírgula (vazio = fila geral)
              <input value={regions} onChange={(e) => setRegions(e.target.value)} />
            </label>
            <label>
              Plantões por dia
              <select
                value={shifts.length}
                onChange={(e) => {
                  const count = Number(e.target.value);
                  setShifts(
                    Array.from(
                      { length: count },
                      (_, index) =>
                        shifts[index] || {
                          name: `Plantão ${index + 1}`,
                          start: 0,
                          end: 0,
                        },
                    ),
                  );
                }}
              >
                {Array.from({ length: MAX_SHIFTS }, (_, index) => (
                  <option key={index} value={index + 1}>
                    {index + 1} sorteio(s)
                  </option>
                ))}
              </select>
            </label>
            <p>
              Edite início e fim de cada plantão. Os horários não podem se sobrepor; a ordem é
              sorteada em cada início configurado.
            </p>
            {shifts.map((shift, index) => (
              <fieldset key={index}>
                <legend>Plantão {index + 1}</legend>
                <label>
                  Nome
                  <input
                    required
                    maxLength={50}
                    value={shift.name}
                    onChange={(e) =>
                      setShifts(
                        shifts.map((s, i) => (i === index ? { ...s, name: e.target.value } : s)),
                      )
                    }
                  />
                </label>
                <label>
                  Início
                  <input
                    type="time"
                    required
                    value={time(shift.start)}
                    onChange={(e) =>
                      setShifts(
                        shifts.map((s, i) =>
                          i === index ? { ...s, start: minute(e.target.value) } : s,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Fim
                  <input
                    type="time"
                    required
                    value={time(shift.end)}
                    onChange={(e) =>
                      setShifts(
                        shifts.map((s, i) =>
                          i === index ? { ...s, end: minute(e.target.value) } : s,
                        ),
                      )
                    }
                  />
                </label>
              </fieldset>
            ))}
            <label>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />{' '}
              Distribuir nesta fila (desmarcado mantém os novos leads aguardando)
            </label>
            <p>
              Uma fila regional tem prioridade sobre a geral. A configuração só passa a controlar
              leads novos depois de salva; leads antigos sem responsável não entram automaticamente.
              Início igual ao fim representa um plantão de 24 horas.
            </p>
            <button className="btn" disabled={busy}>
              {busy ? 'Registrando…' : 'Salvar fila'}
            </button>
            {editing && (
              <button type="button" className="btn secondary" onClick={reset}>
                Cancelar edição / nova fila
              </button>
            )}
          </form>
        </section>
      )}
    </>
  );
}
