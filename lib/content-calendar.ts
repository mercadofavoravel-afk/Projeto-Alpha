import type { ContentPlanStatus, PublicationChannel, PublicationStatus } from '@prisma/client';

export const contentPlanStatuses: readonly ContentPlanStatus[] = [
  'DRAFT',
  'READY',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
];

export const publicationChannels: readonly PublicationChannel[] = [
  'INSTAGRAM',
  'FACEBOOK',
  'LINKEDIN',
  'YOUTUBE',
  'TIKTOK',
  'KWAI',
  'BLOG',
];

export const publicationStatuses: readonly PublicationStatus[] = [
  'PENDING',
  'READY',
  'SCHEDULED',
  'PUBLISHED',
  'FAILED',
  'CANCELED',
];

export const contentPlanStatusLabels: Record<ContentPlanStatus, string> = {
  DRAFT: 'Rascunho',
  READY: 'Pronto para publicar',
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em publicação',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
};

export const publicationChannelLabels: Record<PublicationChannel, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  KWAI: 'Kwai',
  BLOG: 'Blog',
};

export const publicationStatusLabels: Record<PublicationStatus, string> = {
  PENDING: 'Pendente',
  READY: 'Pronto',
  SCHEDULED: 'Agendado',
  PUBLISHED: 'Publicado',
  FAILED: 'Falhou',
  CANCELED: 'Cancelado',
};

export function isOfficialDestination(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'imoveisdealtopadraorio.com.br' ||
        url.hostname.endsWith('.imoveisdealtopadraorio.com.br'))
    );
  } catch {
    return value.startsWith('/');
  }
}

export function completionFromAttempts(statuses: PublicationStatus[]) {
  const active = statuses.filter((status) => status !== 'CANCELED');
  if (active.length === 0) return 0;
  return Math.round(
    (active.filter((status) => status === 'PUBLISHED').length / active.length) * 100,
  );
}
