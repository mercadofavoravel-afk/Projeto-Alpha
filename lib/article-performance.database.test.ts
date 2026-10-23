import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { db } from './db';
import { articleLeadPerformanceQuery } from './article-performance-query';
import type { ChannelCount } from './article-performance';

describe.runIf(process.env.ROULETTE_DATABASE_TESTS === '1')(
  'métricas editoriais no PostgreSQL de testes',
  () => {
    it('groups campaign fields even when the lead has a different source column', async () => {
      const url = new URL(process.env.DATABASE_URL!);
      if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.includes('test'))
        throw new Error('Este teste só executa em banco local de testes.');
      const slug = `metric-test-${randomUUID()}`;
      const now = new Date();
      const since = new Date(now.getTime() - 60000);
      const rollback = new Error('rollback-editorial-fixture');
      try {
        await db.$transaction(async (tx) => {
          await tx.lead.createMany({
            data: ['cpc', 'organic'].map((medium) => ({
              name: 'Teste local',
              phone: 'test-only',
              consent: false,
              articleSlug: slug,
              source: 'Mesmo rótulo da página',
              utmSource: 'google',
              utmMedium: medium,
              createdAt: since,
            })),
          });
          const rows = await tx.$queryRaw<ChannelCount[]>(articleLeadPerformanceQuery(since, now));
          expect(
            rows
              .filter((row) => row.slug === slug)
              .sort((a, b) => a.medium!.localeCompare(b.medium!)),
          ).toEqual([
            { slug, source: 'google', medium: 'cpc', count: 1 },
            { slug, source: 'google', medium: 'organic', count: 1 },
          ]);
          throw rollback;
        });
      } catch (error) {
        if (error !== rollback) throw error;
      }
    });
  },
);
