import type { LeadStatus, Prisma } from '@prisma/client';

export const customerLeadStatuses: readonly LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VISIT_SCHEDULED',
  'WON',
  'LOST',
];

export type CustomerLeadFilters = {
  status?: LeadStatus;
  query?: string;
  from?: string;
  to?: string;
};

function validDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00-03:00`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? undefined
    : value;
}

export function parseCustomerLeadFilters(input: {
  status?: unknown;
  q?: unknown;
  from?: unknown;
  to?: unknown;
}): CustomerLeadFilters {
  const status =
    typeof input.status === 'string' && customerLeadStatuses.includes(input.status as LeadStatus)
      ? (input.status as LeadStatus)
      : undefined;
  const query = typeof input.q === 'string' ? input.q.trim().slice(0, 120) : '';
  const from = validDate(input.from);
  const to = validDate(input.to);
  return {
    ...(status ? { status } : {}),
    ...(query ? { query } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
}

export function customerLeadWhere(
  siteId: string,
  filters: CustomerLeadFilters,
): Prisma.CustomerLeadWhereInput {
  const and: Prisma.CustomerLeadWhereInput[] = [];
  if (filters.status) and.push({ status: filters.status });
  if (filters.from || filters.to) {
    and.push({
      createdAt: {
        ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00-03:00`) } : {}),
        ...(filters.to
          ? {
              lt: new Date(new Date(`${filters.to}T00:00:00-03:00`).getTime() + 24 * 60 * 60 * 1000),
            }
          : {}),
      },
    });
  }
  if (filters.query) {
    and.push({
      OR: [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { phone: { contains: filters.query, mode: 'insensitive' } },
        { email: { contains: filters.query, mode: 'insensitive' } },
        { source: { contains: filters.query, mode: 'insensitive' } },
        {
          article: {
            is: { title: { contains: filters.query, mode: 'insensitive' } },
          },
        },
      ],
    });
  }
  return { siteId, ...(and.length ? { AND: and } : {}) };
}

function csvCell(value: unknown) {
  let text =
    value instanceof Date
      ? value.toISOString()
      : value === null || value === undefined
        ? ''
        : String(value);
  if (/^[\s\u0000-\u001f]*[=+\-@]/u.test(text)) text = `'${text}`;
  return `"${text.replace(/"/gu, '""')}"`;
}

export type CustomerLeadCsvRow = {
  createdAt: Date;
  name: string;
  phone: string;
  email: string | null;
  objective: string;
  status: string;
  source: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  article: { title: string } | null;
};

const columns: Array<keyof CustomerLeadCsvRow | 'articleTitle'> = [
  'createdAt',
  'name',
  'phone',
  'email',
  'objective',
  'status',
  'source',
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'articleTitle',
];

export function customerLeadsToCsv(rows: CustomerLeadCsvRow[]) {
  const header = [
    'Data de entrada',
    'Nome',
    'Telefone',
    'E-mail',
    'Objetivo',
    'Status',
    'Origem',
    'UTM source',
    'UTM medium',
    'UTM campaign',
    'Artigo',
  ];
  const lines = [
    header.map(csvCell).join(','),
    ...rows.map((row) =>
      columns
        .map((column) =>
          csvCell(
            column === 'articleTitle'
              ? row.article?.title
              : row[column as keyof CustomerLeadCsvRow],
          ),
        )
        .join(','),
    ),
  ];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
