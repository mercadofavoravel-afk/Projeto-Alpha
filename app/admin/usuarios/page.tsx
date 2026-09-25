import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function Page() {
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
  return (
    <>
      <div className="eyebrow">Administração</div>
      <h1>Usuários e acessos</h1>
      <p>
        Aqui você consulta as contas existentes. O cadastro de corretores e gerentes, a edição de
        perfis e a distribuição de leads ainda não estão disponíveis neste painel.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Função</th>
            <th>Status</th>
            <th>Sessões</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
