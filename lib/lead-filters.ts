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
  responsible?: string;
};

function validStatus(value: string | undefined): LeadStatusFilter | undefined {
  return leadStatuses.includes(value as LeadStatusFilter) ? (value as LeadStatusFilter) : undefined;
}

export function parseLeadFilters(values: {
  channel?: string;
  campaign?: string;
  status?: string;
  responsible?: string;
}): LeadFilters {
  const channel = ['organic', 'campaign', 'direct'].includes(values.channel || '')
    ? (values.channel as LeadFilters['channel'])
    : undefined;
  const campaign = values.campaign?.trim() || undefined;
  const responsible = values.responsible?.trim().slice(0, 128) || undefined;

  return {
    channel,
    campaign,
    status: validStatus(values.status),
    ...(responsible ? { responsible } : {}),
  };
}

export function buildLeadWhere(filters: LeadFilters): Prisma.LeadWhereInput {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.responsible ? { assignedToId: filters.responsible } : {}),
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
          utmMedium: 'organic',
        }
      : {}),
    ...(filters.channel === 'campaign' && !filters.campaign
      ? {
          utmCampaign: {
            not: null,
          },
        }
      : {}),
    ...(filters.channel === 'direct'
      ? {
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
