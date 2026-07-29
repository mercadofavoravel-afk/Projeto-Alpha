import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectEditor } from "./ProjectEditor";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) notFound();
  const serialized = JSON.parse(JSON.stringify(project));
  return <div className="admin"><aside className="side"><div className="brand">ALPHA ADMIN<small>CMS EDITORIAL</small></div><Link href="/admin/empreendimentos">Voltar aos empreendimentos</Link></aside><main className="main"><div className="eyebrow">Editor visual</div><h1>{project.name}</h1><div className="notice">A publicação deve ocorrer somente após revisão de informações comerciais, jurídicas e técnicas.</div><ProjectEditor project={serialized}/></main></div>;
}
