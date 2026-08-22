import type { Metadata } from 'next';
import Link from 'next/link';
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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="admin">
      <aside className="side">
        <div className="brand">
          ALPHA ADMIN
          <small>{user.role}</small>
        </div>

        <Link href="/admin">
          Visão geral
        </Link>

        {hasPermission(
          user.role,
          'catalog:write',
        ) && (
          <>
            <Link href="/admin/empreendimentos">
              Empreendimentos
            </Link>

            <Link href="/admin/bairros">
              Bairros
            </Link>

            <Link href="/admin/incorporadoras">
              Incorporadoras
            </Link>

            <Link href="/admin/fontes">
              Fontes
            </Link>

            <Link href="/admin/discovery">
              Discovery
            </Link>
          </>
        )}

        {hasPermission(
          user.role,
          'crm:write',
        ) && (
          <Link href="/admin/leads">
            Leads
          </Link>
        )}

        {hasPermission(
          user.role,
          'media:write',
        ) && (
          <>
            <Link href="/admin/books">
              Books
            </Link>

            <Link href="/admin/midia">
              Mídia
            </Link>
          </>
        )}

        {hasPermission(
          user.role,
          'analytics:read',
        ) && (
          <>
            <Link href="/admin/seo">
              SEO Mission Control
            </Link>

            <Link href="/admin/analytics">
              Analytics
            </Link>

            <Link href="/admin/recomendacoes">
              Recomendações
            </Link>
          </>
        )}

        {user.role === 'ADMIN' && (
          <Link href="/admin/usuarios">
            Usuários
          </Link>
        )}

        <form action={logoutAction}>
          <button className="side-button">
            Sair
          </button>
        </form>
      </aside>

      <main className="main">
        {children}
      </main>
    </div>
  );
}
