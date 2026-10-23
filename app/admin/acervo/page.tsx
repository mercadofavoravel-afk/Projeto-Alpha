import Link from 'next/link';
import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { archiveKinds } from '@/lib/commercial-archive';
import { ArchivePanel } from './ArchivePanel';
import { saveArchiveLink } from './actions';

export const dynamic = 'force-dynamic';

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('media:write');
  const params = await searchParams;
  const items = await db.archiveItem.findMany({
    orderBy: [{ organization: 'asc' }, { title: 'asc' }],
    select: {
      id: true,
      title: true,
      kind: true,
      organization: true,
      organizationKind: true,
      projectName: true,
      url: true,
      fileName: true,
      sizeBytes: true,
      status: true,
      origin: true,
      notes: true,
      extractedText: true,
    },
  });
  return (
    <>
      <div className="eyebrow">Acervo comercial · acesso interno</div>
      <h1>Books e links por incorporadora</h1>
      <p>
        Consulte os links, books, plantas e tabelas recuperados. Pastas sem autoria confirmada ficam
        em um grupo próprio. Um link cadastrado não confirma que seu destino esteja disponível.
      </p>
      <p>
        <Link href="/admin/books">Processamento de books</Link> ·{' '}
        <Link href="/admin/fontes">Pesquisar fontes</Link> · <Link href="/admin/leads">Leads</Link>
      </p>
      {params.salvo && (
        <p role="status">Link salvo. Se já existia, mantivemos o cadastro original.</p>
      )}
      {params.erro && <p role="alert">Confira o título e informe um link HTTP ou HTTPS válido.</p>}
      <ArchivePanel items={items} />
      <details className="panel">
        <summary>Adicionar link ou book por URL</summary>
        <form action={saveArchiveLink} className="form-grid">
          <label>
            Título
            <input name="title" required minLength={2} maxLength={300} />
          </label>
          <label>
            Link
            <input name="url" type="url" required />
          </label>
          <label>
            Incorporadora ou imobiliária
            <input name="organization" maxLength={200} />
          </label>
          <label>
            Empreendimento
            <input name="projectName" maxLength={200} />
          </label>
          <label>
            Tipo
            <select name="kind">
              {Object.entries(archiveKinds).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="primary" type="submit">
            Guardar no acervo
          </button>
        </form>
      </details>
    </>
  );
}
