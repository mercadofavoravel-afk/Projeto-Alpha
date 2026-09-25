import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { ProjectEditor } from './ProjectEditor';
import { FloorPlanForm } from './FloorPlanForm';
import { PhotoPrioritySelect } from './PhotoPrioritySelect';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('catalog:write');

  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: { media: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] } },
  });
  if (!project) notFound();
  const serialized = JSON.parse(JSON.stringify(project));
  return (
    <>
      <Link href="/admin/empreendimentos">Voltar aos empreendimentos</Link>
      <div className="eyebrow">Editor visual</div>
      <h1>{project.name}</h1>
      <div className="notice">
        A publicação deve ocorrer somente após revisão de informações comerciais, jurídicas e
        técnicas.
      </div>
      <ProjectEditor project={serialized} />
      <section className="property-plans">
        <h2>Fotos do empreendimento</h2>
        <p>
          Cadastre URLs públicas das fotos aprovadas. Priorize fachada, fachada noturna e lazer. A
          fachada pode ser usada como capa quando não houver imagem principal definida acima.
        </p>
        <FloorPlanForm projectId={project.id} kind="IMAGE" />
        {project.media
          .filter((item) => item.kind === 'IMAGE')
          .map((item) => (
            <p key={item.id}>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.caption || item.alt || 'Foto cadastrada'}
              </a>{' '}
              <PhotoPrioritySelect id={item.id} position={item.position} />
            </p>
          ))}
      </section>
      <section className="property-plans">
        <h2>Plantas do empreendimento</h2>
        <p>Cadastre o endereço público da planta aprovada para exibi-la na página do projeto.</p>
        <FloorPlanForm projectId={project.id} />
        {project.media
          .filter((item) => item.kind === 'FLOOR_PLAN')
          .map((item) => (
            <p key={item.id}>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.caption || item.alt || 'Planta cadastrada'}
              </a>
            </p>
          ))}
      </section>
    </>
  );
}
