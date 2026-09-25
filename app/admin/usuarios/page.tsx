import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createEmployee, updateEmployee } from './actions';
export const dynamic = 'force-dynamic';
const roleNames = {
  MANAGER: 'Gerente',
  CONSULTANT: 'Corretor',
  EDITOR: 'Editor',
  MARKETING: 'Marketing',
  VIEWER: 'Consulta',
} as const;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  await requireRole(['ADMIN']);
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { sessions: true } },
    },
  });
  const { result } = await searchParams;
  const notices: Record<string, string> = {
    created: 'Profissional cadastrado.',
    updated: 'Acesso atualizado.',
    invalid: 'Confira os dados. A senha precisa ter pelo menos 12 caracteres.',
    duplicate: 'Este e-mail já está cadastrado.',
    self: 'Altere sua própria conta por outro administrador.',
  };
  return (
    <>
      <div className="eyebrow">Administração</div>
      <h1>Usuários e acessos</h1>
      <p>
        Cadastre profissionais com senha individual. Gerentes veem a equipe e podem distribuir
        leads. Corretores veem somente os leads atribuídos a eles.
      </p>
      {result && <p role="status">{notices[result] || 'Não foi possível salvar.'}</p>}
      <form action={createEmployee} className="admin-card form-grid">
        <h2>Cadastrar profissional</h2>
        <label>
          Nome
          <input name="name" minLength={2} maxLength={100} required />
        </label>
        <label>
          E-mail de acesso
          <input name="email" type="email" required />
        </label>
        <label>
          Função
          <select name="role" required>
            {Object.entries(roleNames).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Senha inicial individual
          <input
            name="password"
            type="password"
            minLength={12}
            autoComplete="new-password"
            required
          />
        </label>
        <p>
          Compartilhe a senha com o profissional por um canal seguro; ele poderá trocá-la após
          entrar.
        </p>
        <button className="btn" type="submit">
          Criar acesso
        </button>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Função</th>
              <th>Status</th>
              <th>Sessões</th>
              <th>Gerenciar</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <b>{u.name ?? 'Sem nome'}</b>
                  <br />
                  <small>{u.email}</small>
                </td>
                <td>{u.role}</td>
                <td>{u.isActive ? 'Ativo' : 'Bloqueado'}</td>
                <td>{u._count.sessions}</td>
                <td>
                  {u.role === 'ADMIN' ? (
                    'Administrador'
                  ) : (
                    <form action={updateEmployee} className="form-grid">
                      <input type="hidden" name="userId" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        aria-label={`Função de ${u.name || u.email}`}
                      >
                        {Object.entries(roleNames).map(([value, name]) => (
                          <option key={value} value={value}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <select
                        name="isActive"
                        defaultValue={u.isActive ? 'true' : 'false'}
                        aria-label={`Situação de ${u.name || u.email}`}
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Bloqueado</option>
                      </select>
                      <button className="btn" type="submit">
                        Salvar
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
