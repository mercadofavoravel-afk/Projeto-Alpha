import { requireApiPermission } from '@/lib/auth';
import {
  customerLeadWhere,
  customerLeadsToCsv,
  parseCustomerLeadFilters,
} from '@/lib/customer-lead-export';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const exportLimit = 20_000;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission('sites:manage');
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const { id: siteId } = await params;
  const site = await db.customerSite.findFirst({
    where: { id: siteId, ownerId: auth.user.id },
    select: { id: true },
  });
  if (!site) return Response.json({ error: 'Site não encontrado.' }, { status: 404 });

  const query = new URL(request.url).searchParams;
  const filters = parseCustomerLeadFilters({
    status: query.get('status'),
    q: query.get('q'),
    from: query.get('from'),
    to: query.get('to'),
  });
  const rows = await db.customerLead.findMany({
    where: customerLeadWhere(site.id, filters),
    orderBy: { createdAt: 'desc' },
    take: exportLimit + 1,
    select: {
      createdAt: true,
      name: true,
      phone: true,
      email: true,
      objective: true,
      status: true,
      source: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      article: { select: { title: true } },
    },
  });
  if (rows.length > exportLimit) {
    return Response.json(
      {
        error: 'Muitos resultados. Aplique um período menor e tente novamente.',
      },
      { status: 413 },
    );
  }

  const body = customerLeadsToCsv(rows);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="alpha-leads-${date}.csv"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
