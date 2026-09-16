import { db } from '@/lib/db';
import { requireApiPermission } from '@/lib/auth';
import { buildLeadWhere, parseLeadFilters, statusLabel } from '@/lib/lead-filters';

function csvCell(value: unknown) {
  const text = String(value ?? '');
  const safeText = /^[=+\-@]/u.test(text) ? `'${text}` : text;

  return `"${safeText.replace(/"/gu, '""')}"`;
}

function toCsvRow(values: unknown[]) {
  return values.map(csvCell).join(',');
}

export async function GET(request: Request) {
  const auth = await requireApiPermission('crm:read');

  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const filters = parseLeadFilters({
    channel: url.searchParams.get('channel') || undefined,
    campaign: url.searchParams.get('campaign') || undefined,
    status: url.searchParams.get('status') || undefined,
  });

  const leads = await db.lead.findMany({
    where: buildLeadWhere(filters),
    select: {
      createdAt: true,
      name: true,
      phone: true,
      email: true,
      objective: true,
      neighborhood: true,
      source: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      consent: true,
      status: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 2000,
  });

  const csv = [
    toCsvRow([
      'Criado em',
      'Nome',
      'Telefone',
      'E-mail',
      'Objetivo',
      'Região',
      'Origem',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'Consentimento',
      'Estágio',
    ]),
    ...leads.map((lead) =>
      toCsvRow([
        lead.createdAt.toISOString(),
        lead.name,
        lead.phone,
        lead.email,
        lead.objective,
        lead.neighborhood,
        lead.source,
        lead.utmSource,
        lead.utmMedium,
        lead.utmCampaign,
        lead.consent ? 'Sim' : 'Não',
        statusLabel(lead.status),
      ]),
    ),
  ].join('\n');

  return new Response(`\uFEFF${csv}`, {
    headers: {
      'Content-Disposition': 'attachment; filename="leads-alpha.csv"',
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
