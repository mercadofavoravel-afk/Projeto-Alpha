import type { Prisma } from '@prisma/client';

export const leadStatuses = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VISIT_SCHEDULED',
  'WON',
  'LOST',
] as const;

type LeadStatusFilter = (typeof leadStatuses)[number];

export type LeadFilters = {
  channel?: 'organic' | 'campaign' | 'direct';
  campaign?: string;
  status?: LeadStatusFilter;
};

function validStatus(value: string | undefined): LeadStatusFilter | undefined {
  return leadStatuses.includes(value as LeadStatusFilter) ? (value as LeadStatusFilter) : undefined;
}

export function parseLeadFilters(values: {
  channel?: string;
  campaign?: string;
  status?: string;
}): LeadFilters {
  const channel = ['organic', 'campaign', 'direct'].includes(values.channel || '')
    ? (values.channel as LeadFilters['channel'])
    : undefined;
  const campaign = values.campaign?.trim() || undefined;

  return {
    channel,
    campaign,
    status: validStatus(values.status),
  };
}

export function buildLeadWhere(filters: LeadFilters): Prisma.LeadWhereInput {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.campaign
      ? {
          utmCampaign: {
            contains: filters.campaign,
            mode: 'insensitive' as const,
          },
        }
      : {}),
    ...(filters.channel === 'organic'
      ? {
          source: {
            startsWith: 'Orgânico | artigo:',
          },
        }
      : {}),
    ...(filters.channel === 'campaign'
      ? {
          utmSource: {
            not: null,
          },
        }
      : {}),
    ...(filters.channel === 'direct'
      ? {
          source: null,
          utmSource: null,
        }
      : {}),
  };
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    NEW: 'Novo',
    CONTACTED: 'Em atendimento',
    QUALIFIED: 'Qualificado',
    VISIT_SCHEDULED: 'Visita agendada',
    WON: 'Ganho',
    LOST: 'Perdido',
  };

  return labels[status] || status;
}
