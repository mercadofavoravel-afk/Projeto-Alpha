import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCandidates } from '@/lib/recommendation/db-candidates';
import { rankProjects } from '@/lib/recommendation/engine';
import { recommendationSchema } from '@/lib/recommendation/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = recommendationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Perfil inválido',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const ranked = rankProjects(
      await getCandidates(),
      input,
    ).slice(0, 8);

    const resultData = ranked.map((project, index) => ({
      projectId: project.id,
      score: project.score,
      position: index + 1,
      reasons: project.reasons,
    }));

    let profile;

    if (input.sessionKey) {
      profile = await db.recommendationProfile.upsert({
        where: {
          sessionKey: input.sessionKey,
        },
        update: {
          objective: input.objective,
          preferredBairros: input.preferredBairros,
          preferredTypes: input.preferredTypes,
          budgetMax: input.budgetMax,
          areaMin: input.areaMin,
          bedroomsMin: input.bedroomsMin,
          suitesMin: input.suitesMin,
          parkingMin: input.parkingMin,
          proximityBeach: input.proximityBeach,
          proximityMetro: input.proximityMetro,
          investmentFocus: input.investmentFocus,
          lifestyleFocus: input.lifestyleFocus,
          results: {
            deleteMany: {},
            create: resultData,
          },
        },
        create: {
          ...input,
          results: {
            create: resultData,
          },
        },
      });
    } else {
      profile = await db.recommendationProfile.create({
        data: {
          ...input,
          results: {
            create: resultData,
          },
        },
      });
    }

    await db.analyticsEvent.create({
      data: {
        name: 'recommendation_generated',
        path: '/descubra',
        sessionKey: input.sessionKey,
        profileId: profile.id,
        metadata: {
          resultCount: ranked.length,
          topScore: ranked[0]?.score ?? 0,
        },
      },
    });

    return NextResponse.json({
      profileId: profile.id,
      results: ranked,
    });
  } catch (error) {
    console.error('Erro ao gerar recomendação:', error);

    return NextResponse.json(
      {
        error: 'Não foi possível gerar a seleção neste momento.',
      },
      { status: 500 },
    );
  }
}
