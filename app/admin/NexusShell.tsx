'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function NexusShell({
  children,
  navigation,
  logout,
  name,
  role,
}: {
  children: React.ReactNode;
  navigation: React.ReactNode;
  logout: React.ReactNode;
  name: string;
  role: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [light, setLight] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setLight(localStorage.getItem('alpha-nexus-theme') === 'light');
    setCollapsed(localStorage.getItem('alpha-nexus-sidebar') === 'collapsed');
  }, []);
  useEffect(() => {
    setMobileOpen(false);
    nav.current?.querySelectorAll('a').forEach((link) => {
      const path = new URL(link.href).pathname.replace(/^\/alpha(?=\/|$)/, '').replace(/\/$/, '');
      const current = pathname.replace(/^\/alpha(?=\/|$)/, '').replace(/\/$/, '');
      if (path === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }, [pathname]);

  function toggleTheme() {
    setLight(!light);
    localStorage.setItem('alpha-nexus-theme', !light ? 'light' : 'dark');
  }
  function toggleSidebar() {
    setCollapsed(!collapsed);
    localStorage.setItem('alpha-nexus-sidebar', !collapsed ? 'collapsed' : 'open');
  }
  return (
    <div
      className={`admin nexus${light ? ' nexus-light' : ''}${collapsed ? ' nexus-collapsed' : ''}${mobileOpen ? ' nexus-mobile-open' : ''}`}
    >
      <a className="nexus-skip" href="#nexus-content">
        Ir para o conteúdo
      </a>
      {mobileOpen && (
        <button
          className="nexus-backdrop"
          aria-label="Fechar navegação"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className="side nexus-side" id="nexus-navigation">
        <Link className="nexus-brand" href="/admin" aria-label="Alpha Nexus — Central">
          <span className="nexus-symbol" aria-hidden="true">
            N
          </span>
          <span className="nexus-brand-copy">
            ALPHA <b>NEXUS</b>
            <small>INTELIGÊNCIA COMERCIAL</small>
          </span>
        </Link>
        <div className="nexus-nav-label">WORKSPACE</div>
        <nav ref={nav} className="nexus-nav" aria-label="Navegação do CRM">
          {navigation}
        </nav>
        <div className="nexus-side-footer">
          <span className="nexus-avatar" aria-hidden="true">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="nexus-user">
            <strong>{name}</strong>
            <small>{role}</small>
          </div>
          {logout}
        </div>
      </aside>
      <div className="nexus-workspace">
        <header className="nexus-topbar">
          <button
            type="button"
            className="nexus-icon-button nexus-desktop-toggle"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expandir navegação' : 'Recolher navegação'}
            aria-expanded={!collapsed}
            aria-controls="nexus-navigation"
          >
            ☰
          </button>
          <button
            type="button"
            className="nexus-icon-button nexus-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir navegação"
            aria-expanded={mobileOpen}
            aria-controls="nexus-navigation"
          >
            ☰
          </button>
          <div className="nexus-breadcrumb">
            ALPHA NEXUS <span>/</span> <strong>Workspace comercial</strong>
          </div>
          <div className="nexus-top-actions">
            <button
              type="button"
              onClick={toggleTheme}
              className="nexus-theme"
              aria-label={light ? 'Ativar tema escuro' : 'Ativar tema claro'}
            >
              {light ? '◐ Escuro' : '☼ Claro'}
            </button>
            <Link href="/admin/minha-conta" className="nexus-account">
              Minha conta <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </header>
        <main className="main nexus-main" id="nexus-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="nexus-footer">
          <span>ALPHA NEXUS</span> · Imóveis de Alto Padrão Rio
        </footer>
      </div>
    </div>
  );
}
