import type { Metadata } from 'next';
import Link from 'next/link';
import type { UserRole } from '@prisma/client';

import { logoutAction } from '@/app/login/actions';
import { requireUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export const metadata: Metadata = {
  title: 'Administração',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

function AdminLinks({ role }: { role: UserRole }) {
  return (
    <>
      <Link href="/admin">Visão geral</Link>

      {hasPermission(role, 'catalog:write') && (
        <>
          <Link href="/admin/empreendimentos">Empreendimentos</Link>

          <Link href="/admin/bairros">Bairros</Link>

          <Link href="/admin/incorporadoras">Incorporadoras</Link>

          <Link href="/admin/fontes">Fontes</Link>

          <Link href="/admin/discovery">Discovery</Link>

          <Link href="/admin/artigos">Artigos</Link>
        </>
      )}

      {hasPermission(role, 'crm:read') && (
        <>
          <Link href="/admin/leads">Leads</Link>

          <Link href="/admin/leads/kanban">Quadro comercial</Link>

          <Link href="/admin/agenda">Agenda</Link>
        </>
      )}

      {hasPermission(role, 'media:write') && (
        <>
          <Link href="/admin/books">Books</Link>

          <Link href="/admin/midia">Mídia</Link>
        </>
      )}

      {hasPermission(role, 'analytics:read') && (
        <>
          <Link href="/admin/seo">SEO Mission Control</Link>

          <Link href="/admin/analytics">Analytics</Link>

          <Link href="/admin/recomendacoes">Recomendações</Link>
        </>
      )}

      {hasPermission(role, 'crm:reports') && <Link href="/admin/origens">Origens e conversões</Link>}

      {hasPermission(role, 'users:manage') && <Link href="/admin/usuarios">Usuários</Link>}
      <Link href="/admin/minha-conta">Minha conta</Link>
    </>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="admin">
      <aside className="side">
        <div className="brand">
          ALPHA ADMIN
          <small>{user.role}</small>
        </div>

        <nav className="admin-desktop-links" aria-label="Navegação administrativa">
          <AdminLinks role={user.role} />
        </nav>

        <details className="admin-mobile-links">
          <summary>Menu do painel</summary>
          <nav aria-label="Navegação administrativa no celular">
            <AdminLinks role={user.role} />
          </nav>
        </details>

        <form action={logoutAction}>
          <button className="side-button">Sair</button>
        </form>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
