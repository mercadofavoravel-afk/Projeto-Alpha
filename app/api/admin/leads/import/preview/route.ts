import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { requireApiPermission } from '@/lib/auth';
import { previewLeadTable, type ColumnMapping } from '@/lib/lead-import';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const auth = await requireApiPermission('crm:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size > 3_000_000 || !/\.(csv|xlsx)$/i.test(file.name))
      throw new Error('Escolha CSV ou XLSX de até 3 MB.');
    const mapping = form.get('mapping')
      ? (JSON.parse(String(form.get('mapping'))) as ColumnMapping)
      : undefined;
    let table: string[][];
    if (/\.csv$/i.test(file.name)) {
      const { parseCsv } = await import('@/lib/lead-import');
      table = parseCsv(await file.text());
    } else {
      const book = new ExcelJS.Workbook();
      await book.xlsx.load(await file.arrayBuffer());
      const sheet = book.worksheets[0];
      if (!sheet || sheet.rowCount > 2001 || sheet.columnCount > 50)
        throw new Error('Use a primeira aba com até 2.000 leads e 50 colunas.');
      table = [];
      sheet.eachRow((row) => {
        const values: string[] = [];
        for (let c = 1; c <= sheet.columnCount; c++) values.push(row.getCell(c).text);
        table.push(values);
      });
    }
    if (table.some((r) => r.length > 50)) throw new Error('Limite de 50 colunas.');
    return NextResponse.json(previewLeadTable(table, mapping), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível ler a planilha.' },
      { status: 400 },
    );
  }
}
