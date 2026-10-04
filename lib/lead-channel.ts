export type LeadChannel = {
  utmSource: string | null;
  utmMedium: string | null;
};

export function channelFromLead(lead: LeadChannel) {
  const platform = lead.utmSource?.trim().toLowerCase();
  const medium = lead.utmMedium?.trim().toLowerCase();

  if (platform) return medium ? `${platform} / ${medium}` : platform;
  if (medium === 'organic') return 'Busca orgânica (plataforma não identificada)';
  return 'Plataforma não identificada';
}
