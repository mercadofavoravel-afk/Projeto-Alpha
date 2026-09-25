import Link from 'next/link';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { projectImageFromMedia } from '@/lib/project-image';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requirePermission('catalog:write');

  const projects = await db.project.findMany({
    include: {
      neighborhood: true,
      media: { select: { kind: true, url: true } },
      typologies: { select: { floorPlan: true } },
    },
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
            <th>Imagem</th>
            <th>Plantas</th>
            <th>Atualizado</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/admin/empreendimentos/${p.id}`}>{p.name}</Link>
              </td>

              <td>{p.neighborhood.name}</td>
              <td>{p.publishStatus}</td>
              <td>
                {projectImageFromMedia(p.slug, p.heroImage, p.media) ? 'Disponível' : 'Pendente'}
              </td>
              <td>
                {p.media.filter((item) => item.kind === 'FLOOR_PLAN').length +
                  p.typologies.filter((item) => Boolean(item.floorPlan)).length || 'Pendente'}
              </td>
              <td>{p.updatedAt.toLocaleDateString('pt-BR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
