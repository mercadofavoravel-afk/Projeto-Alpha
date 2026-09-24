import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { ProjectEditor } from './ProjectEditor';
import { FloorPlanForm } from './FloorPlanForm';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('catalog:write');

  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: { media: { where: { kind: 'FLOOR_PLAN' }, orderBy: { position: 'asc' } } },
  });
  if (!project) notFound();
  const serialized = JSON.parse(JSON.stringify(project));
  return (
    <div className="admin">
      <aside className="side">
        <div className="brand">
          ALPHA ADMIN<small>CMS EDITORIAL</small>
        </div>
        <Link href="/admin/empreendimentos">Voltar aos empreendimentos</Link>
      </aside>
      <main className="main">
        <div className="eyebrow">Editor visual</div>
        <h1>{project.name}</h1>
        <div className="notice">
          A publicação deve ocorrer somente após revisão de informações comerciais, jurídicas e
          técnicas.
        </div>
        <ProjectEditor project={serialized} />
        <section className="property-plans">
          <h2>Plantas do empreendimento</h2>
          <p>Cadastre o endereço público da planta aprovada para exibi-la na página do projeto.</p>
          <FloorPlanForm projectId={project.id} />
          {project.media.map((item) => (
            <p key={item.id}>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.caption || item.alt || 'Planta cadastrada'}
              </a>
            </p>
          ))}
        </section>
      </main>
    </div>
  );
}
