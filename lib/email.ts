import 'server-only';

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
