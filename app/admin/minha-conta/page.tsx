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
      <h1>Minha conta</h1>
      <p>
        {user.name || user.email} · {user.email}
      </p>
      <form action={changeOwnPassword} className="admin-card form-grid">
        <h2>Alterar senha</h2>
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
        <p>Após a troca, entre novamente com a nova senha.</p>
        {result === 'invalid' && (
          <p role="alert">A nova senha precisa ter de 12 a 128 caracteres.</p>
        )}
        {result === 'current' && <p role="alert">A senha atual está incorreta.</p>}
        <button type="submit" className="btn">
          Salvar nova senha
        </button>
      </form>
    </>
  );
}
