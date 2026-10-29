import Link from 'next/link';
import './nexus-login.css';
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
    <main className="login-shell nexus-login">
      <form className="login-card" action={loginAction}>
        <div className="nexus-login-symbol" aria-hidden="true">
          N
        </div>
        <div className="eyebrow">SEU WORKSPACE COMERCIAL</div>
        <h1>
          ALPHA <span>NEXUS</span>
        </h1>
        <p>Entre para dar o próximo passo.</p>
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
