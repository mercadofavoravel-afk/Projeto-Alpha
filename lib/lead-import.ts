import { z } from 'zod';

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export const importedLeadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(z.string().regex(/^\d{10,15}$/)),
  email: z
    .union([z.string().trim().email().max(254), z.literal('')])
    .nullable()
    .optional()
    .transform((value) => value?.toLowerCase() || null),
  neighborhood: z.string().trim().max(100).optional().default(''),
  message: z.string().trim().max(2000).optional().default(''),
});

export type ImportedLead = z.output<typeof importedLeadSchema>;
export const importFields = ['name', 'phone', 'email', 'neighborhood', 'message'] as const;
export type ImportField = (typeof importFields)[number];
export type ColumnMapping = Partial<Record<ImportField, string>>;

export function parseCsv(text: string): string[][] {
  text = text.replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/, 1)[0];
  const delimiter =
    (firstLine.match(/;/g)?.length || 0) > (firstLine.match(/,/g)?.length || 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (ch === delimiter || ch === '\n')) {
      row.push(cell.replace(/\r$/, ''));
      cell = '';
      if (ch === '\n') {
        if (row.some((x) => x.trim())) rows.push(row);
        row = [];
      }
    } else cell += ch;
  }
  if (quoted) throw new Error('CSV com aspas não fechadas.');
  row.push(cell.replace(/\r$/, ''));
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const aliases: Record<ImportField, string[]> = {
  name: ['nome', 'name', 'cliente', 'nome completo'],
  phone: ['telefone', 'phone', 'celular', 'whatsapp', 'fone'],
  email: ['email', 'e-mail'],
  neighborhood: ['bairro', 'regiao', 'neighborhood'],
  message: ['observacao', 'observacoes', 'mensagem', 'message'],
};
const key = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export function previewLeadTable(table: string[][], chosen?: ColumnMapping) {
  if (table.length < 2 || table.length > 2001) throw new Error('Use de 1 a 2.000 linhas de leads.');
  const headers = table[0].map((s) => s.trim());
  if (new Set(headers.map(key)).size !== headers.length || headers.some((s) => !s))
    throw new Error('Use nomes únicos e preenchidos para as colunas.');
  const mapping: ColumnMapping =
    chosen ||
    Object.fromEntries(
      importFields.map((field) => [
        field,
        headers.find((h) => aliases[field].includes(key(h))) || '',
      ]),
    );
  if (
    !mapping.name ||
    !mapping.phone ||
    !headers.includes(mapping.name) ||
    !headers.includes(mapping.phone)
  )
    return {
      headers,
      mapping,
      rows: [],
      errors: [{ line: 1, error: 'Selecione as colunas de nome e telefone.' }],
    };
  const rows: ImportedLead[] = [],
    errors: Array<{ line: number; error: string }> = [];
  const seen = new Set<string>();
  for (const [i, values] of table.slice(1).entries()) {
    const raw = Object.fromEntries(
      importFields.map((field) => [field, values[headers.indexOf(mapping[field] || '')] || '']),
    );
    const parsed = importedLeadSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({ line: i + 2, error: 'Confira nome, telefone e e-mail desta linha.' });
      continue;
    }
    const row = parsed.data;
    if (seen.has(`p:${row.phone}`) || (row.email && seen.has(`e:${row.email}`))) {
      errors.push({ line: i + 2, error: 'Contato repetido dentro da planilha.' });
      continue;
    }
    seen.add(`p:${row.phone}`);
    if (row.email) seen.add(`e:${row.email}`);
    rows.push(row);
  }
  return { headers, mapping, rows, errors };
}
