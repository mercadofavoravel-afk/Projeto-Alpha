import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import type { UserRole } from '@prisma/client';
import { createEmployee, updateEmployee } from './actions';
export const dynamic = 'force-dynamic';
const roleNames = {
  DIRECTOR: 'Diretor',
  MANAGER: 'Gerente',
  CONSULTANT: 'Corretor',
  EDITOR: 'Editor',
  MARKETING: 'Marketing',
  VIEWER: 'Consulta',
} as const;
const salesRoleNames = { MANAGER: 'Gerente', CONSULTANT: 'Corretor' } as const;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const actor = await requireRole(['ADMIN', 'DIRECTOR']);
  const manageableRoles = actor.role === 'ADMIN' ? roleNames : salesRoleNames;
  const users = await db.user.findMany({
    where:
      actor.role === 'DIRECTOR' ? { role: { in: ['MANAGER', 'CONSULTANT'] as UserRole[] } } : {},
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { sessions: true } },
      acceptsLeads: true,
      leadCapacity: true,
      serviceRegions: true,
      assignedLeads: {
        where: { status: { notIn: ['WON', 'LOST'] } },
        select: { id: true },
      },
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
        Diretores gerenciam a equipe comercial, conteúdos e indicadores. Gerentes distribuem leads;
        corretores veem somente os leads atribuídos a eles.
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
            {Object.entries(manageableRoles).map(([value, name]) => (
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
        <label>
          Recebimento de leads
          <select name="acceptsLeads" defaultValue="false">
            <option value="false">Indisponível</option>
            <option value="true">Disponível</option>
          </select>
        </label>
        <label>
          Capacidade de leads ativos
          <input name="leadCapacity" type="number" min={1} max={500} defaultValue={30} required />
        </label>
        <label className="full">
          Regiões de atendimento
          <input name="serviceRegions" placeholder="Barra da Tijuca, Ipanema, Centro" />
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
              <th>Distribuição</th>
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
                <td>{u.role === 'ADMIN' ? 'Administrador' : roleNames[u.role]}</td>
                <td>{u.isActive ? 'Ativo' : 'Bloqueado'}</td>
                <td>{u._count.sessions}</td>
                <td>
                  {u.acceptsLeads ? 'Disponível' : 'Indisponível'} · {u.assignedLeads.length}/
                  {u.leadCapacity} ativos
                  <br />
                  <small>{u.serviceRegions.join(', ') || 'Todas as regiões'}</small>
                </td>
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
                        {Object.entries(manageableRoles).map(([value, name]) => (
                          <option key={value} value={value}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <select name="acceptsLeads" defaultValue={u.acceptsLeads ? 'true' : 'false'}>
                        <option value="false">Não receber</option>
                        <option value="true">Disponível</option>
                      </select>
                      <input
                        name="leadCapacity"
                        type="number"
                        min={1}
                        max={500}
                        defaultValue={u.leadCapacity}
                        aria-label={`Capacidade de ${u.name || u.email}`}
                      />
                      <input
                        name="serviceRegions"
                        defaultValue={u.serviceRegions.join(', ')}
                        placeholder="Regiões separadas por vírgula"
                        aria-label={`Regiões de ${u.name || u.email}`}
                      />
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
