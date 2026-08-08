import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCandidates } from '@/lib/recommendation/db-candidates';
import { rankProjects } from '@/lib/recommendation/engine';
import { recommendationSchema } from '@/lib/recommendation/validation';
export async function POST(req: Request) {
  const parsed = recommendationSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Perfil inválido', details: parsed.error.flatten() },
      { status: 400 },
    );
  const input = parsed.data;
  const ranked = rankProjects(await getCandidates(), input).slice(0, 8);
  const profile = await db.recommendationProfile.create({
    data: {
      ...input,
      results: {
        create: ranked.map((p, i) => ({
          projectId: p.id,
          score: p.score,
          position: i + 1,
          reasons: p.reasons,
        })),
      },
    },
  });
  await db.analyticsEvent.create({
    data: {
      name: 'recommendation_generated',
      path: '/descubra',
      sessionKey: input.sessionKey,
      profileId: profile.id,
      metadata: { resultCount: ranked.length, topScore: ranked[0]?.score ?? 0 },
    },
  });
  return NextResponse.json({ profileId: profile.id, results: ranked });
}
