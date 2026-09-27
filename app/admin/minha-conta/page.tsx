import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { changeOwnPassword } from './actions';

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const user = await requireUser();
  const { result } = await searchParams;
  return (
    <>
      <h1>Senha e segurança</h1>
      <p>
        {user.name || user.email} · {user.email}
      </p>
      <p>
        Troque a senha quando quiser. Se não lembrar da senha atual, peça um link no seu e-mail.
      </p>
      <form action={changeOwnPassword} className="admin-card form-grid">
        <h2>Trocar senha</h2>
        <label>
          Senha atual
          <input type="password" name="currentPassword" autoComplete="current-password" required />
        </label>
        <label>
          Nova senha
          <input
            type="password"
            name="newPassword"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirmar nova senha
          <input
            type="password"
            name="confirmPassword"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        <p>Após a troca, entre novamente com a nova senha.</p>
        {result === 'invalid' && (
          <p role="alert">
            A nova senha precisa ter de 12 a 128 caracteres e a confirmação deve ser igual.
          </p>
        )}
        {result === 'current' && <p role="alert">A senha atual está incorreta.</p>}
        <button type="submit" className="btn">
          Salvar nova senha
        </button>
      </form>
      <section className="admin-card">
        <h2>Esqueceu a senha atual?</h2>
        <p>Receba por e-mail um link de uso único para definir outra senha.</p>
        <Link className="btn" href="/recuperar-senha">
          Recuperar senha por e-mail
        </Link>
      </section>
    </>
  );
}
