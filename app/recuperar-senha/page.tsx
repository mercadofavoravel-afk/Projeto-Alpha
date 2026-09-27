import Link from 'next/link';
import { requestResetAction } from './actions';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const q = await searchParams;
  return (
    <main className="login-shell">
      <form className="login-card" action={requestResetAction}>
        <div className="eyebrow">Segurança</div>
        <h1>Recuperar senha</h1>
        <p>
          Informe o e-mail da conta. Por segurança, a resposta será igual mesmo quando o endereço
          não estiver cadastrado.
        </p>
        {q.sent && (
          <div className="notice">
            Se a conta estiver ativa, confira o e-mail e o spam. Se já pediu há poucos minutos, use
            o link anterior.
          </div>
        )}
        {q.error === 'unavailable' && (
          <div className="notice">
            A recuperação por e-mail está indisponível no momento. Tente novamente mais tarde ou
            procure o responsável pelo seu acesso.
          </div>
        )}
        <label>
          E-mail
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <button className="btn">Solicitar recuperação</button>
        <Link className="text-link" href="/login">
          Voltar ao login
        </Link>
      </form>
    </main>
  );
}
