import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  buildArticlePerformance,
  canReadEditorialPerformance,
  type ChannelCount,
} from '@/lib/article-performance';
import { crmDayStartAfter, crmDayWindow } from '@/lib/crm-day';

export const dynamic = 'force-dynamic';
export async function GET() {
  const auth = await requireApiPermission('users:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!canReadEditorialPerformance(auth.user.role))
    return NextResponse.json({ error: 'Acesso restrito à gestão da matriz.' }, { status: 403 });
  const now = new Date();
  const since = crmDayStartAfter(now, -27);
  const { today, tomorrow } = crmDayWindow(now);
  try {
    const [articles, events, leads, snapshot] = await Promise.all([
      db.article.findMany({
        where: { publishStatus: 'PUBLISHED' },
        select: { slug: true, title: true, category: true },
      }),
      db.$queryRaw<Array<ChannelCount & { name: string }>>`
        SELECT COALESCE(NULLIF(metadata->>'articleSlug', ''), substring(path from '/artigos/([a-z0-9-]+)')) AS slug,
          NULLIF(LOWER(TRIM(metadata->>'utmSource')), '') AS source,
          NULLIF(LOWER(TRIM(metadata->>'utmMedium')), '') AS medium,
          name, COUNT(*)::int AS count,
          COUNT(*) FILTER (WHERE "createdAt" >= ${today} AND "createdAt" < ${tomorrow})::int AS today
        FROM "AnalyticsEvent"
        WHERE name IN ('article_view', 'article_contact_click') AND "createdAt" >= ${since} AND "createdAt" <= ${now}
        GROUP BY slug, source, medium, name
      `,
      db.$queryRaw<ChannelCount[]>`
        SELECT "articleSlug" AS slug, NULLIF(LOWER(TRIM("utmSource")), '') AS source,
          NULLIF(LOWER(TRIM("utmMedium")), '') AS medium, COUNT(*)::int AS count
        FROM "Lead" WHERE "articleSlug" IS NOT NULL AND "createdAt" >= ${since} AND "createdAt" <= ${now}
        GROUP BY "articleSlug", source, medium
      `,
      db.auditLog.findFirst({
        where: { action: 'editorial.search_snapshot' },
        orderBy: { createdAt: 'desc' },
        select: { metadata: true },
      }),
    ]);
    const startDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(since);
    return NextResponse.json(
      {
        ...buildArticlePerformance(
          articles,
          events.filter((e) => e.name === 'article_view'),
          events.filter((e) => e.name === 'article_contact_click'),
          leads,
          snapshot?.metadata,
          startDate,
        ),
        updatedAt: now.toISOString(),
        startDate,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível atualizar as métricas.' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
