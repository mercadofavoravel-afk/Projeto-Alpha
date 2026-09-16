type UTMFields = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
};

export function normalizeUtmValue(value?: string | null) {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 200);

  return normalized || undefined;
}

export function normalizeLeadUtms(fields: UTMFields) {
  return {
    utmSource: normalizeUtmValue(fields.utmSource),
    utmMedium: normalizeUtmValue(fields.utmMedium),
    utmCampaign: normalizeUtmValue(fields.utmCampaign),
  };
}
