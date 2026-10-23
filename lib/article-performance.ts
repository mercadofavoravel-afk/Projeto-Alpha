import { z } from 'zod';

export const canReadEditorialPerformance = (role: string) => ['ADMIN', 'DIRECTOR'].includes(role);
export function articleSlugFromUrl(value: string) {
  try {
    const url = new URL(value);
    if (
      !['imoveisdealtopadraorio.com.br', 'www.imoveisdealtopadraorio.com.br'].includes(url.hostname)
    )
      return null;
    return /^\/alpha\/artigos\/([a-z0-9-]+)\/?$/.exec(url.pathname)?.[1] ?? null;
  } catch {
    return null;
  }
}

export const searchSnapshotSchema = z.object({
  property: z.literal('sc-domain:imoveisdealtopadraorio.com.br'),
  dataState: z.literal('final'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fetchedAt: z.string().datetime(),
  rows: z
    .array(
      z.object({
        keys: z.tuple([
          z.string().refine((url) => !!articleSlugFromUrl(url)),
          z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        ]),
        clicks: z.number().int().nonnegative(),
        impressions: z.number().int().nonnegative(),
        position: z.number().nonnegative(),
      }),
    )
    .max(10000),
});

export type ChannelCount = {
  slug: string;
  source: string | null;
  medium: string | null;
  count: number;
  today?: number;
};
export function trafficKind(medium: string | null) {
  const value = medium?.trim().toLowerCase() ?? '';
  if (
    /^(cpc|ppc|paid|paidsearch|paid_search|paid_social|paidsocial|cpm|display|cpv|cpa)$/.test(value)
  )
    return 'Pago';
  return value === 'organic' ? 'Orgânico' : 'Outras / não identificada';
}

export function buildArticlePerformance(
  articles: { slug: string; title: string; category: string | null }[],
  views: ChannelCount[],
  clicks: ChannelCount[],
  leads: ChannelCount[],
  rawSnapshot: unknown,
  startDate: string,
) {
  const parsed = searchSnapshotSchema.safeParse(rawSnapshot);
  const snapshot = parsed.success ? parsed.data : null;
  const search = new Map<string, { clicks: number; impressions: number; weighted: number }>();
  for (const row of snapshot?.rows ?? []) {
    if (row.keys[1] < startDate) continue;
    const slug = articleSlugFromUrl(row.keys[0])!;
    const item = search.get(slug) ?? { clicks: 0, impressions: 0, weighted: 0 };
    item.clicks += row.clicks;
    item.impressions += row.impressions;
    item.weighted += row.position * row.impressions;
    search.set(slug, item);
  }
  const rows = articles.map((article) => {
    const channels = new Map<
      string,
      { platform: string; kind: string; views: number; clicks: number; leads: number }
    >();
    for (const [kind, counts] of [
      ['views', views],
      ['clicks', clicks],
      ['leads', leads],
    ] as const) {
      for (const item of counts.filter((item) => item.slug === article.slug)) {
        const platform = item.source?.trim().toLowerCase() || 'Não identificada';
        const group = trafficKind(item.medium);
        const key = `${platform}:${group}`;
        const channel = channels.get(key) ?? {
          platform,
          kind: group,
          views: 0,
          clicks: 0,
          leads: 0,
        };
        channel[kind] += item.count;
        channels.set(key, channel);
      }
    }
    const list = [...channels.values()];
    const gsc = search.get(article.slug);
    const total = (key: 'views' | 'clicks' | 'leads') =>
      list.reduce((sum, item) => sum + item[key], 0);
    return {
      ...article,
      views: total('views'),
      contactClicks: total('clicks'),
      leads: total('leads'),
      viewsToday: views
        .filter((item) => item.slug === article.slug)
        .reduce((sum, item) => sum + (item.today ?? 0), 0),
      organicViews: list
        .filter((item) => item.kind === 'Orgânico')
        .reduce((sum, item) => sum + item.views, 0),
      paidViews: list
        .filter((item) => item.kind === 'Pago')
        .reduce((sum, item) => sum + item.views, 0),
      channels: list,
      google: gsc
        ? {
            clicks: gsc.clicks,
            impressions: gsc.impressions,
            ctr: gsc.impressions ? gsc.clicks / gsc.impressions : 0,
            position: gsc.impressions ? gsc.weighted / gsc.impressions : null,
          }
        : null,
    };
  });
  return {
    rows,
    search: snapshot
      ? {
          fetchedAt: snapshot.fetchedAt,
          startDate: snapshot.startDate,
          endDate: snapshot.endDate,
          lastDataDate:
            snapshot.rows.reduce((max, row) => (row.keys[1] > max ? row.keys[1] : max), '') || null,
        }
      : null,
  };
}
