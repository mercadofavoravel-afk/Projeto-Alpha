import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footergrid">
        <div>
          <b>IMÓVEIS DE ALTO PADRÃO RIO</b>
          <p>Curadoria imobiliária premium.</p>
        </div>

        <div>
          <Link href="/empreendimentos">Empreendimentos</Link>
        </div>

        <div>
          <Link href="/colecoes">Coleções</Link>
        </div>

        <div>
          <Link href="/descubra">Descubra</Link>
        </div>
      </div>
    </footer>
  );
}
