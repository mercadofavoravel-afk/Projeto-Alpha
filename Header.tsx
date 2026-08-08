import Link from 'next/link';
export function Header() {
  return (
    <header className="header">
      <div className="wrap nav">
        <Link className="brand" href="/">
          IMÓVEIS DE ALTO PADRÃO<small>RIO DE JANEIRO</small>
        </Link>
        <nav className="links">
          <Link href="/buscar">Buscar</Link>
          <Link href="/empreendimentos">Empreendimentos</Link>
          <Link href="/colecoes">Coleções</Link>
          <Link href="/admin">Admin</Link>
        </nav>
        <Link className="btn" href="/buscar">
          Explorar
        </Link>
      </div>
    </header>
  );
}
