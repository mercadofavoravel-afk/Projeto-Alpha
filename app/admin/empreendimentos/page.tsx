import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const projects = await db.project.findMany({
    include: { neighborhood: true },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <>
      <div className="eyebrow">Conteúdo</div>
      <h1>Empreendimentos</h1>

      <table className="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Bairro</th>
            <th>Workflow</th>
            <th>Atualizado</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/admin/empreendimentos/${p.id}`}>
                  {p.name}
                </Link>
              </td>

              <td>{p.neighborhood.name}</td>
              <td>{p.publishStatus}</td>
              <td>
                {p.updatedAt.toLocaleDateString('pt-BR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
