import { Prisma } from '@prisma/client';

export function articleLeadPerformanceQuery(since: Date, now: Date) {
  return Prisma.sql`
    SELECT "articleSlug" AS slug, NULLIF(LOWER(TRIM("utmSource")), '') AS source,
      NULLIF(LOWER(TRIM("utmMedium")), '') AS medium, COUNT(*)::int AS count
    FROM "Lead" WHERE "articleSlug" IS NOT NULL AND "createdAt" >= ${since} AND "createdAt" <= ${now}
    GROUP BY 1, 2, 3
  `;
}
