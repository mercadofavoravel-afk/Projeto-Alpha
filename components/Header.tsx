import Link from 'next/link';

export function Header() {
  return (
    <header className="header luxury-header">
      <div className="wrap nav">
        <Link
          className="brand luxury-brand"
          href="/"
          aria-label="Imóveis de Alto Padrão Rio — Início"
        >
          IMÓVEIS DE ALTO PADRÃO
          <small>RIO DE JANEIRO</small>
        </Link>

        <nav
          className="links luxury-nav-links"
          aria-label="Navegação principal"
        >
          <Link href="/buscar">Buscar</Link>
          <Link href="/empreendimentos">Empreendimentos</Link>
          <Link href="/colecoes">Coleções</Link>
          <Link href="/descubra">Descubra</Link>
        </nav>

        <Link className="luxury-nav-cta" href="/descubra">
          Curadoria personalizada
        </Link>
      </div>
    </header>
  );
}
