'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { alphaPath } from '@/lib/public-path';
import { importFields, type ColumnMapping, type ImportedLead } from '@/lib/lead-import';

type Preview = {
  headers: string[];
  mapping: ColumnMapping;
  rows: ImportedLead[];
  errors: Array<{ line: number; error: string }>;
};
type Campaign = {
  id: string;
  name: string;
  status: string;
  mode: string;
  intervalMinutes: number;
  nextRunAt: string | null;
  brokerIds: string[];
  items: Array<{
    id: string;
    status: string;
    assignedToId: string | null;
    deliveredAt: string | null;
    reason: string | null;
    lead: { id: string; name: string };
  }>;
};
type Dashboard = {
  schedulerLastSeenAt?: string | null;
  campaigns: Campaign[];
  counts: Array<{ campaignId: string; status: string; _count: { _all: number } }>;
  brokers: Array<{ id: string; name: string | null; email: string }>;
};
const labels = {
  name: 'Nome',
  phone: 'Telefone',
  email: 'E-mail',
  neighborhood: 'Bairro',
  message: 'Observações',
};

export default function IntakePanel() {
  const [dashboard, setDashboard] = useState<Dashboard>({ campaigns: [], counts: [], brokers: [] });
  const [preview, setPreview] = useState<Preview | null>(null),
    [mapping, setMapping] = useState<ColumnMapping>({});
  const [manual, setManual] = useState({
    name: '',
    phone: '',
    email: '',
    neighborhood: '',
    message: '',
  });
  const [file, setFile] = useState<File | null>(null),
    [name, setName] = useState('Cadastro manual');
  const [queue, setQueue] = useState(false),
    [brokers, setBrokers] = useState<string[]>([]),
    [minutes, setMinutes] = useState(3),
    [mode, setMode] = useState('ONE');
  const [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  const batch = useRef<string | null>(null);
  const lastPayload = useRef('');
  const refresh = useCallback(async () => {
    const response = await fetch(alphaPath('/api/admin/leads/repique'), { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível carregar as filas.');
    setDashboard(data);
  }, []);
  useEffect(() => {
    void refresh().catch((e) => setNotice(e.message));
  }, [refresh]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void fetch(alphaPath('/api/admin/leads/repique'), { method: 'PATCH' })
        .then((r) => {
          if (!r.ok) throw new Error('Falha ao atualizar repique.');
          return refresh();
        })
        .catch((e) => setNotice(e.message));
    }, 30_000);
    return () => clearInterval(timer);
  }, [refresh]);
  async function readFile(custom = false) {
    if (!file) return;
    setBusy(true);
    setNotice('');
    try {
      const form = new FormData();
      form.set('file', file);
      if (custom) form.set('mapping', JSON.stringify(mapping));
      const response = await fetch(alphaPath('/api/admin/leads/import/preview'), {
        method: 'POST',
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPreview(data);
      setMapping(data.mapping);
      batch.current = null;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Falha na leitura.');
    } finally {
      setBusy(false);
    }
  }
  async function save(isManual: boolean) {
    setBusy(true);
    setNotice('');
    try {
      const payloadKey = JSON.stringify({
        name,
        rows: isManual ? [manual] : preview?.rows,
        consent,
        queue,
        brokers,
        minutes,
        mode,
      });
      if (lastPayload.current !== payloadKey) batch.current = null;
      lastPayload.current = payloadKey;
      batch.current ||= crypto.randomUUID();
      const response = await fetch(alphaPath('/api/admin/leads/import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.current,
          name,
          rows: isManual ? [manual] : preview?.rows,
          consent,
          ...(queue ? { campaign: { brokerIds: brokers, intervalMinutes: minutes, mode } } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNotice(
        `Concluído: ${data.created} novos, ${data.reused} já existentes preservados, ${data.ambiguous} contatos ambíguos ignorados. ${data.queued} leads na fila pausada.`,
      );
      batch.current = null;
      setPreview(null);
      setManual({ name: '', phone: '', email: '', neighborhood: '', message: '' });
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Falha no cadastro.');
    } finally {
      setBusy(false);
    }
  }
  async function command(id: string, action: string) {
    setBusy(true);
    try {
      const r = await fetch(alphaPath('/api/admin/leads/repique'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Falha na fila.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p>
        <Link href="/admin/usuarios">Cadastrar e configurar a equipe</Link> ·{' '}
        <Link href="/admin/leads">Voltar aos leads</Link>
      </p>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <section className="admin-card">
        <h2>1. Identificação e distribuição</h2>
        <label>
          Nome da lista / origem{' '}
          <input
            value={name}
            maxLength={100}
            onChange={(e) => {
              setName(e.target.value);
              batch.current = null;
            }}
          />
        </label>
        <label>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{' '}
          Existe registro de consentimento destes contatos (deixe desmarcado se não houver
          comprovação).
        </label>
        <label>
          <input type="checkbox" checked={queue} onChange={(e) => setQueue(e.target.checked)} />{' '}
          Criar uma fila de repique com esta lista
        </label>
        {queue && (
          <>
            <p>
              Contatos já existentes serão preservados e poderão entrar no repique. Leads ganhos ou
              perdidos ficam fora. Nenhuma mensagem é enviada ao cliente.
            </p>
            <fieldset>
              <legend>Corretores participantes</legend>
              {dashboard.brokers.map((b) => (
                <label key={b.id} style={{ display: 'block' }}>
                  <input
                    type="checkbox"
                    checked={brokers.includes(b.id)}
                    onChange={(e) =>
                      setBrokers(
                        e.target.checked ? [...brokers, b.id] : brokers.filter((id) => id !== b.id),
                      )
                    }
                  />{' '}
                  {b.name || b.email}
                </label>
              ))}
            </fieldset>
            <label>
              Intervalo em minutos{' '}
              <input
                type="number"
                min={1}
                max={1440}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </label>
            <label>
              Distribuição{' '}
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="ONE">Um lead por intervalo, alternando os corretores</option>
                <option value="ROUND">Até um lead por corretor em cada intervalo</option>
              </select>
            </label>
            <p>
              A distribuição respeita capacidade, região e disponibilidade cadastral. Leads
              alterados depois da preparação serão ignorados e registrados no histórico.
            </p>
          </>
        )}
      </section>
      <section className="admin-card">
        <h2>2. Cadastrar um lead manualmente</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save(true);
          }}
        >
          {importFields.map((field) => (
            <label key={field} style={{ display: 'block' }}>
              {labels[field]}{' '}
              <input
                required={field === 'name' || field === 'phone'}
                type={field === 'email' ? 'email' : 'text'}
                maxLength={field === 'message' ? 2000 : 254}
                value={manual[field]}
                onChange={(e) => {
                  setManual({ ...manual, [field]: e.target.value });
                  batch.current = null;
                }}
              />
            </label>
          ))}
          <button disabled={busy || (queue && !brokers.length)} className="btn">
            Salvar lead{queue ? ' e preparar fila' : ''}
          </button>
        </form>
      </section>
      <section className="admin-card">
        <h2>3. Importar CSV ou Excel</h2>
        <p>
          Primeira aba do XLSX, até 2.000 contatos e 3 MB. Use cabeçalhos únicos; você poderá
          escolher as colunas. Telefones brasileiros com DDD podem ser informados sem 55.
        </p>
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setPreview(null);
            batch.current = null;
          }}
        />
        <button disabled={!file || busy} onClick={() => void readFile()}>
          Conferir arquivo
        </button>
        {preview && (
          <>
            <h3>Mapeamento das colunas</h3>
            {importFields.map((field) => (
              <label key={field}>
                {labels[field]}{' '}
                <select
                  value={mapping[field] || ''}
                  onChange={(e) => {
                    setMapping({ ...mapping, [field]: e.target.value });
                    setPreview({ ...preview, rows: [] });
                  }}
                >
                  <option value="">Não importar</option>
                  {preview.headers.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </label>
            ))}
            <button disabled={busy} onClick={() => void readFile(true)}>
              Aplicar mapeamento e conferir
            </button>
            <p>
              {preview.rows.length} linhas válidas; {preview.errors.length} linhas rejeitadas.
              Somente as válidas serão importadas.
            </p>
            {preview.errors.slice(0, 20).map((e, i) => (
              <p key={i}>
                Linha {e.line}: {e.error}
              </p>
            ))}
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Bairro</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td>{r.name}</td>
                    <td>{r.phone}</td>
                    <td>{r.neighborhood}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="btn"
              disabled={busy || !preview.rows.length || (queue && !brokers.length)}
              onClick={() => void save(false)}
            >
              Confirmar importação de {preview.rows.length} linhas válidas
            </button>
          </>
        )}
      </section>
      <section className="admin-card">
        <h2>Filas de repique</h2>
        <p role="status">
          Última execução automática do servidor:{' '}
          {dashboard.schedulerLastSeenAt
            ? new Date(dashboard.schedulerLastSeenAt).toLocaleString('pt-BR')
            : 'Ainda não comprovada. Não conte com a distribuição de painel fechado até a configuração ser verificada.'}
        </p>
        <p>
          O primeiro intervalo começa após iniciar. Pausar impede novas distribuições, sem desfazer
          as já concluídas. Com o painel fechado, é necessário que a rotina de servidor esteja
          configurada e monitorada.
        </p>
        {dashboard.campaigns.map((c) => (
          <article key={c.id}>
            <h3>{c.name}</h3>
            <p>
              {c.status} · {c.intervalMinutes} min ·{' '}
              {c.mode === 'ROUND' ? 'Uma rodada por intervalo' : 'Um lead por intervalo'} · próxima
              execução: {c.nextRunAt ? new Date(c.nextRunAt).toLocaleString('pt-BR') : '—'}
            </p>
            <p>
              {dashboard.counts
                .filter((x) => x.campaignId === c.id)
                .map((x) => `${x.status}: ${x._count._all}`)
                .join(' · ')}
            </p>
            {c.status !== 'COMPLETED' && (
              <button
                disabled={busy}
                onClick={() => void command(c.id, c.status === 'RUNNING' ? 'pause' : 'start')}
              >
                {c.status === 'RUNNING' ? 'Pausar' : 'Iniciar / retomar'}
              </button>
            )}
            <details>
              <summary>Últimos 20 itens e histórico</summary>
              {c.items.map((item) => (
                <p key={item.id}>
                  <Link href={`/admin/leads/${item.lead.id}`}>{item.lead.name}</Link> —{' '}
                  {item.status}
                  {item.assignedToId
                    ? ` — ${dashboard.brokers.find((b) => b.id === item.assignedToId)?.name || item.assignedToId}`
                    : ''}
                  {item.reason ? ` — ${item.reason}` : ''}
                </p>
              ))}
            </details>
          </article>
        ))}
      </section>
    </>
  );
}
