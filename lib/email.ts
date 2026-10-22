import 'server-only';

type NewLeadEmail = {
  to: string;
  lead: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    neighborhood: string | null;
    articleSlug: string | null;
    source: string | null;
    consent: boolean;
  };
  idempotencyKey: string;
};

export async function sendNewLeadEmail({ to, lead, idempotencyKey }: NewLeadEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error('Configuração de e-mail transacional ausente');

  const lines = [
    'Novo contato registrado no CRM matriz do Projeto Alpha.',
    `Nome: ${lead.name}`,
    `Telefone: ${lead.phone}`,
    `E-mail: ${lead.email || 'não informado'}`,
    `Bairro: ${lead.neighborhood || 'não informado'}`,
    `Artigo: ${lead.articleSlug || 'não atribuído'}`,
    `Origem declarada: ${lead.source || 'não informada'}`,
    `Consentimento para contato: ${lead.consent ? 'sim' : 'não'}`,
    '',
    `Ficha no CRM: https://imoveisdealtopadraorio.com.br/alpha/admin/leads/${encodeURIComponent(lead.id)}`,
  ];
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Alpha — novo lead ${(lead.neighborhood || 'sem bairro').replace(/[\r\n]/g, ' ').slice(0, 80)}`,
      text: lines.join('\n'),
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Falha no aviso de novo lead (${response.status})`);
}

type PasswordResetEmail = {
  to: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail({ to, resetUrl }: PasswordResetEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error('Configuração de e-mail transacional ausente');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Redefinição de senha — Projeto Alpha',
      text: `Recebemos uma solicitação para redefinir sua senha. Use este link em até 30 minutos: ${resetUrl}`,
      html: `<p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${resetUrl}">Redefinir senha</a></p><p>Este link expira em 30 minutos.</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao enviar e-mail transacional (${response.status})`);
  }
}

export async function sendCrmRiskDigestEmail({
  to,
  day,
  counts,
  idempotencyKey,
}: {
  to: string;
  day: string;
  counts: Record<string, number>;
  idempotencyKey: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error('Configuração de e-mail transacional ausente');

  const labels: Record<string, string> = {
    unassigned: 'Leads sem responsável',
    firstContact: 'Primeiros contatos pendentes',
    overdueFollowUp: 'Acompanhamentos vencidos',
    stalled: 'Leads parados há 48 horas',
  };
  const lines = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => `${labels[kind] ?? kind}: ${count}`);
  if (lines.length === 0) return;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Alpha — pendências de atendimento (${day})`,
      text: [
        `Resumo do CRM em ${day}. Prazos corridos; uma ficha pode aparecer em mais de uma contagem.`,
        '',
        ...lines,
        '',
        'Abra a agenda para conferir e registrar o atendimento realizado:',
        'https://imoveisdealtopadraorio.com.br/alpha/admin/agenda',
        '',
        'Este aviso não envia mensagens aos clientes nem transfere leads automaticamente.',
      ].join('\n'),
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Falha no resumo do CRM (${response.status})`);
}

export async function sendEmployeeAccessEmail({
  to,
  name,
  initialPassword,
  loginUrl,
  idempotencyKey,
}: {
  to: string;
  name: string;
  initialPassword: string;
  loginUrl: string;
  idempotencyKey: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error('Configuração de e-mail transacional ausente');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Seu acesso à Imóveis de Alto Padrão — Projeto Alpha',
      text: [
        `Olá, ${name}.`,
        'A gestão cadastrou seu acesso à equipe da Imóveis de Alto Padrão.',
        '',
        `Acesse: ${loginUrl}`,
        `E-mail de acesso: ${to}`,
        `Senha inicial individual: ${initialPassword}`,
        '',
        'Você já pode entrar na plataforma. Para escolher sua própria senha, abra Minha conta > Trocar senha.',
        'Para receber leads, a gestão precisa habilitar seu recebimento e você deve fazer check-in no plantão da roleta.',
        'Não compartilhe sua senha. Se precisar de outra, use Esqueci minha senha na tela de acesso.',
      ].join('\n'),
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Falha no envio do acesso (${response.status})`);
}
