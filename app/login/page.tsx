import Link from 'next/link';
import { loginAction } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const query = await searchParams;
  const message =
    query.error === 'RATE_LIMITED'
      ? 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
      : query.error
        ? 'E-mail ou senha inválidos.'
        : query.reset
          ? 'Senha alterada. Entre novamente.'
          : null;
  return (
    <main className="login-shell">
      <form className="login-card" action={loginAction}>
        <div className="eyebrow">Área restrita</div>
        <h1>ALPHA Admin</h1>
        <p>Entre com uma conta autorizada.</p>
        {message && <div className="notice">{message}</div>}
        <label>
          E-mail
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Senha
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
          />
        </label>
        <button className="btn" type="submit">
          Entrar
        </button>
        <Link className="text-link" href="/recuperar-senha">
          Esqueci minha senha
        </Link>
      </form>
    </main>
  );
}
