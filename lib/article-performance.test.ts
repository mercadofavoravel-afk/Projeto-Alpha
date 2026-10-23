import { describe, expect, it } from 'vitest';
import {
  buildArticlePerformance,
  canReadEditorialPerformance,
  trafficKind,
} from './article-performance';
const articles = [{ slug: 'studio', title: 'Studio', category: 'Ipanema' }];
const snapshot = {
  property: 'sc-domain:imoveisdealtopadraorio.com.br',
  dataState: 'final',
  startDate: '2026-09-26',
  endDate: '2026-10-23',
  fetchedAt: '2026-10-23T18:00:00Z',
  rows: [
    {
      keys: ['https://imoveisdealtopadraorio.com.br/alpha/artigos/studio', '2026-10-20'],
      clicks: 1,
      impressions: 10,
      position: 2,
    },
    {
      keys: ['https://www.imoveisdealtopadraorio.com.br/alpha/artigos/studio', '2026-10-21'],
      clicks: 1,
      impressions: 30,
      position: 6,
    },
  ],
};
describe('resultados editoriais da matriz', () => {
  it('separates visits, lead receipts and Google metrics with weighted CTR and position', () => {
    const data = buildArticlePerformance(
      articles,
      [{ slug: 'studio', source: 'google', medium: 'cpc', count: 5, today: 1 }],
      [],
      [{ slug: 'studio', source: null, medium: null, count: 1 }],
      snapshot,
      '2026-09-26',
    );
    expect(data.rows[0]).toMatchObject({
      views: 5,
      viewsToday: 1,
      paidViews: 5,
      organicViews: 0,
      contactClicks: 0,
      leads: 1,
      google: { clicks: 2, impressions: 40, ctr: 0.05, position: 5 },
    });
    expect(data.rows[0].channels).toContainEqual({
      platform: 'Não identificada',
      kind: 'Outras / não identificada',
      views: 0,
      clicks: 0,
      leads: 1,
    });
  });
  it('does not turn missing or foreign search data into zeros or expose raw contacts', () => {
    expect(
      buildArticlePerformance(articles, [], [], [], null, '2026-09-26').rows[0].google,
    ).toBeNull();
    const foreign = {
      ...snapshot,
      rows: [
        { ...snapshot.rows[0], keys: ['https://other.example/alpha/artigos/studio', '2026-10-20'] },
      ],
    };
    expect(buildArticlePerformance(articles, [], [], [], foreign, '2026-09-26').search).toBeNull();
    expect(
      buildArticlePerformance(articles, [], [], [], snapshot, '2026-10-22').rows[0].google,
    ).toBeNull();
  });
  it('limits matrix metrics to management and never assumes an unknown medium is organic', () => {
    for (const role of ['CONSULTANT', 'MANAGER', 'EDITOR', 'MARKETING', 'VIEWER'])
      expect(canReadEditorialPerformance(role)).toBe(false);
    expect(canReadEditorialPerformance('ADMIN')).toBe(true);
    expect(trafficKind(null)).toBe('Outras / não identificada');
    expect(trafficKind('paid_social')).toBe('Pago');
  });
});
