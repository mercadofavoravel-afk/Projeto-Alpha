import Link from 'next/link';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const ps = await db.recommendationProfile.findMany({
    include: { results: { include: { project: true }, orderBy: { position: 'asc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return (
    <div className="admin">
      <aside className="side">
        <div className="brand">
          ALPHA ADMIN<small>RECOMENDAÇÕES</small>
        </div>
        <Link href="/admin">Visão geral</Link>
        <Link href="/admin/recomendacoes">Recomendações</Link>
        <Link href="/admin/analytics">Analytics</Link>
      </aside>
      <main className="main">
        <div className="eyebrow">Motor de recomendação</div>
        <h1>Perfis gerados</h1>
        <div className="notice">
          Resultados servem como apoio à curadoria e não representam garantia financeira.
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Objetivo</th>
              <th>Bairros</th>
              <th>Top recomendado</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {ps.map((p) => (
              <tr key={p.id}>
                <td>{p.createdAt.toLocaleDateString('pt-BR')}</td>
                <td>{p.objective}</td>
                <td>{p.preferredBairros.join(', ') || 'Aberto'}</td>
                <td>{p.results[0]?.project.name || 'Sem resultado'}</td>
                <td>{p.results[0]?.score || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
