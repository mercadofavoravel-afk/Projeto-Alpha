import type { Metadata } from 'next';
import Link from 'next/link';
import type { UserRole } from '@prisma/client';

import { logoutAction } from '@/app/login/actions';
import { requireUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { alphaPath } from '@/lib/public-path';
import { LeadAttention } from './LeadAttention';
import { RoulettePresence } from './RoulettePresence';
import { NexusShell } from './NexusShell';
import './nexus.css';

export const metadata: Metadata = {
  title: 'Alpha Nexus | Central comercial',
  manifest: alphaPath('/manifest.webmanifest'),
  icons: {
    icon: alphaPath('/icons/alpha-192.png'),
    apple: alphaPath('/icons/alpha-192.png'),
  },
  appleWebApp: {
    capable: true,
    title: 'Alpha Nexus',
    statusBarStyle: 'default',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

function AdminLinks({ role }: { role: UserRole }) {
  return (
    <>
      <Link href="/admin">Central Nexus</Link>

      {hasPermission(role, 'catalog:write') && (
        <>
          <Link href="/admin/empreendimentos">Empreendimentos</Link>

          <Link href="/admin/bairros">Bairros</Link>

          <Link href="/admin/incorporadoras">Incorporadoras</Link>

          <Link href="/admin/fontes">Fontes</Link>

          <Link href="/admin/discovery">Discovery</Link>

          <Link href="/admin/artigos">Artigos</Link>
          {['ADMIN', 'DIRECTOR'].includes(role) && (
            <Link href="/admin/artigos/desempenho">Resultados dos artigos</Link>
          )}

          <Link href="/admin/conteudo">Calendário e postagens</Link>
        </>
      )}

      {hasPermission(role, 'crm:read') && (
        <>
          <Link href="/admin/leads">Leads · Radar de oportunidades</Link>

          {hasPermission(role, 'crm:manage') && (
            <Link href="/admin/leads/entrada">Cadastro, planilhas e repique</Link>
          )}
          <Link href="/admin/leads/kanban">Pipeline comercial</Link>

          <Link href="/admin/agenda">Agenda · Próximas ações</Link>
          {['ADMIN', 'DIRECTOR', 'MANAGER', 'CONSULTANT'].includes(role) && (
            <Link href="/admin/roleta">Fila inteligente · Plantões</Link>
          )}
          {['ADMIN', 'DIRECTOR', 'MANAGER'].includes(role) && (
            <Link href="/admin/equipe">Equipe comercial · Squad</Link>
          )}
        </>
      )}

      {hasPermission(role, 'media:write') && (
        <>
          <Link href="/admin/acervo">Acervo · links e materiais</Link>

          <Link href="/admin/midia">Mídia</Link>
        </>
      )}

      {hasPermission(role, 'analytics:read') && (
        <>
          <Link href="/admin/seo">SEO Mission Control</Link>

          <Link href="/admin/canais">Canais orgânicos</Link>

          <Link href="/admin/analytics">Analytics</Link>

          <Link href="/admin/recomendacoes">Recomendações</Link>
        </>
      )}

      {hasPermission(role, 'crm:reports') && (
        <Link href="/admin/origens">Origens e conversões</Link>
      )}

      {hasPermission(role, 'users:manage') && (
        <>
          <Link href="/admin/usuarios">Equipe e acessos</Link>
          <Link href="/admin/integracoes">Integrações de leads</Link>
        </>
      )}
      <Link href="/admin/minha-conta">Senha e segurança</Link>
    </>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const roleNames: Record<string, string> = {
    ADMIN: 'Administrador',
    DIRECTOR: 'Diretor',
    MANAGER: 'Gerente',
    CONSULTANT: 'Corretor',
    EDITOR: 'Editor',
    MARKETING: 'Marketing',
    VIEWER: 'Consulta',
  };
  return (
    <NexusShell
      name={user.name || 'Minha conta'}
      role={roleNames[user.role] || user.role}
      navigation={<AdminLinks role={user.role} />}
      logout={
        <form action={logoutAction}>
          <button className="side-button">Sair</button>
        </form>
      }
    >
      {hasPermission(user.role, 'crm:read') && <LeadAttention />}
      {['ADMIN', 'DIRECTOR', 'MANAGER', 'CONSULTANT'].includes(user.role) && <RoulettePresence />}
      {children}
    </NexusShell>
  );
}
