import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { createOrganicFollowUpActivities } from '@/lib/lead-follow-up';
import { normalizeLeadUtms } from '@/lib/utm';
import { leadSchema } from '@/lib/validation';
import { requireApiPermission } from '@/lib/auth';

export async function GET() {
  const auth = await requireApiPermission('crm:read');

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const leads = await db.lead.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  return NextResponse.json({
    data: leads,
    total: leads.length,
  });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = leadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Dados inválidos',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const utms = normalizeLeadUtms(parsed.data);
  const { typology, ...leadData } = parsed.data;
  const message = typology
    ? `Tipologia desejada: ${typology.replace(/\s+/g, ' ')}${leadData.message ? `\n\n${leadData.message}` : ''}`
    : leadData.message;

  const lead = await db.$transaction(async (transaction) => {
    const createdLead = await transaction.lead.create({
      data: {
        ...leadData,
        ...utms,
        email: parsed.data.email || null,
        message,
      },
    });

    if (createdLead.consent) {
      await transaction.leadActivity.createMany({
        data: createOrganicFollowUpActivities(createdLead, createdLead.createdAt),
      });
    }

    return createdLead;
  });

  return NextResponse.json(
    {
      ok: true,
      leadId: lead.id,
    },
    { status: 201 },
  );
}
