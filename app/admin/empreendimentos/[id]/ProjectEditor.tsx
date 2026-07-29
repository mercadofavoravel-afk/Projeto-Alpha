"use client";
import { FormEvent, useState } from "react";

export function ProjectEditor({ project }: { project: any }) {
  const [form, setForm] = useState(project);
  const [state, setState] = useState("");
  function set(name: string, value: unknown) { setForm((current: any) => ({ ...current, [name]: value })); }
  async function save(event: FormEvent) {
    event.preventDefault(); setState("Salvando...");
    const payload = {
      name: form.name, slug: form.slug, description: form.description,
      neighborhoodId: form.neighborhoodId, developerId: form.developerId || null,
      publishStatus: form.publishStatus, address: form.address || null,
      heroImage: form.heroImage || null, seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null, featured: Boolean(form.featured),
      priceFrom: form.priceFrom || null, priceTo: form.priceTo || null,
      areaFrom: form.areaFrom || null, areaTo: form.areaTo || null,
      bedroomsFrom: form.bedroomsFrom || null, bedroomsTo: form.bedroomsTo || null
    };
    const response = await fetch(`/api/admin/projects/${project.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    setState(response.ok ? "Alterações salvas." : result.error || "Erro ao salvar.");
  }
  return <form className="editor-form" onSubmit={save}>
    <div className="editor-grid">
      <label>Nome<input value={form.name ?? ""} onChange={e=>set("name",e.target.value)}/></label>
      <label>Slug<input value={form.slug ?? ""} onChange={e=>set("slug",e.target.value)}/></label>
      <label>Status<select value={form.publishStatus} onChange={e=>set("publishStatus",e.target.value)}><option>DRAFT</option><option>REVIEW</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label>
      <label>Endereço<input value={form.address ?? ""} onChange={e=>set("address",e.target.value)}/></label>
      <label>Preço inicial<input type="number" value={form.priceFrom ?? ""} onChange={e=>set("priceFrom",e.target.value ? Number(e.target.value) : null)}/></label>
      <label>Preço final<input type="number" value={form.priceTo ?? ""} onChange={e=>set("priceTo",e.target.value ? Number(e.target.value) : null)}/></label>
      <label>Área inicial<input type="number" value={form.areaFrom ?? ""} onChange={e=>set("areaFrom",e.target.value ? Number(e.target.value) : null)}/></label>
      <label>Área final<input type="number" value={form.areaTo ?? ""} onChange={e=>set("areaTo",e.target.value ? Number(e.target.value) : null)}/></label>
      <label className="editor-wide">Imagem principal<input value={form.heroImage ?? ""} onChange={e=>set("heroImage",e.target.value)}/></label>
      <label className="editor-wide">Descrição<textarea rows={8} value={form.description ?? ""} onChange={e=>set("description",e.target.value)}/></label>
      <label className="editor-wide">Título SEO<input value={form.seoTitle ?? ""} onChange={e=>set("seoTitle",e.target.value)}/></label>
      <label className="editor-wide">Descrição SEO<textarea rows={3} value={form.seoDescription ?? ""} onChange={e=>set("seoDescription",e.target.value)}/></label>
    </div>
    <label className="check"><input type="checkbox" checked={Boolean(form.featured)} onChange={e=>set("featured",e.target.checked)}/> Empreendimento em destaque</label>
    <button className="btn">Salvar empreendimento</button> <span>{state}</span>
  </form>;
}
