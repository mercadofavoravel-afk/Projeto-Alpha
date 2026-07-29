import "server-only";

type PasswordResetEmail = {
  to: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail({ to, resetUrl }: PasswordResetEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("Configuração de e-mail transacional ausente");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Redefinição de senha — Projeto Alpha",
      text: `Recebemos uma solicitação para redefinir sua senha. Use este link em até 30 minutos: ${resetUrl}`,
      html: `<p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${resetUrl}">Redefinir senha</a></p><p>Este link expira em 30 minutos.</p>`
    })
  });

  if (!response.ok) {
    throw new Error(`Falha ao enviar e-mail transacional (${response.status})`);
  }
}
