'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { archiveKinds, archiveUrlKey, canonicalArchiveUrl } from '@/lib/commercial-archive';

export async function saveArchiveLink(form: FormData) {
  await requirePermission('media:write');
  const title = String(form.get('title') ?? '')
    .trim()
    .slice(0, 300);
  let url: string;
  try {
    url = canonicalArchiveUrl(String(form.get('url') ?? ''));
  } catch {
    redirect('/admin/acervo?erro=link');
  }
  if (title.length < 2) redirect('/admin/acervo?erro=titulo');
  const kindInput = String(form.get('kind') ?? 'LINK');
  const kind = Object.hasOwn(archiveKinds, kindInput) ? kindInput : 'LINK';
  const organization =
    String(form.get('organization') ?? '')
      .trim()
      .slice(0, 200) || null;
  const projectName =
    String(form.get('projectName') ?? '')
      .trim()
      .slice(0, 200) || null;
  const sourceKey = archiveUrlKey(url);
  // Duplicate submissions preserve existing curation and provenance.
  await db.archiveItem.upsert({
    where: { sourceKey },
    update: {},
    create: {
      sourceKey,
      title,
      kind,
      organization,
      organizationKind: organization ? 'MANUAL' : 'UNCONFIRMED',
      projectName,
      url,
      origin: 'Cadastro no painel',
      status: 'LINK_REGISTERED',
    },
  });
  revalidatePath('/admin/acervo');
  redirect('/admin/acervo?salvo=1');
}

export async function organizeArchiveItem(form: FormData) {
  await requirePermission('media:write');
  const id = String(form.get('id') ?? '');
  const organization =
    String(form.get('organization') ?? '')
      .trim()
      .slice(0, 200) || null;
  const projectName =
    String(form.get('projectName') ?? '')
      .trim()
      .slice(0, 200) || null;
  await db.archiveItem.update({
    where: { id },
    data: {
      organization,
      projectName,
      organizationKind: organization ? 'MANUAL' : 'UNCONFIRMED',
    },
  });
  revalidatePath('/admin/acervo');
}
