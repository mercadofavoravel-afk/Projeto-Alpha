import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiPermission } from '@/lib/auth';

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission('media:write');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const book = await db.bookIngestion.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: 'Book não encontrado' }, { status: 404 });
  if (!['UPLOADED', 'FAILED'].includes(book.status)) {
    return NextResponse.json(
      { error: 'Book já está em processamento ou concluído' },
      { status: 409 },
    );
  }
  const updated = await db.bookIngestion.update({
    where: { id },
    data: { status: 'QUEUED', progress: 5, error: null },
  });
  return NextResponse.json({
    ...updated,
    message:
      'Processamento enfileirado. Conecte este endpoint a um worker externo antes da produção.',
  });
}
