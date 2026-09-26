const CAMPAIGN_STORAGE_KEY = 'alpha_campaign_utms';

export type CampaignUtms = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

function currentCampaignUtms(): CampaignUtms | null {
  const params = new URLSearchParams(window.location.search);
  if (!['utm_source', 'utm_medium', 'utm_campaign'].some((key) => params.has(key))) {
    return null;
  }

  return {
    utmSource: params.get('utm_source')?.trim().slice(0, 200) || undefined,
    utmMedium: params.get('utm_medium')?.trim().slice(0, 200) || undefined,
    utmCampaign: params.get('utm_campaign')?.trim().slice(0, 200) || undefined,
  };
}

// A campaign stays in this browser tab while a visitor explores Alpha pages.
export function getCampaignUtms(): CampaignUtms {
  const current = currentCampaignUtms();
  if (current) {
    try {
      window.sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Storage can be unavailable; the current URL still supplies attribution.
    }
    return current;
  }

  try {
    const saved = window.sessionStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (!saved) return {};

    const parsed: CampaignUtms = JSON.parse(saved);
    return {
      utmSource: typeof parsed.utmSource === 'string' ? parsed.utmSource : undefined,
      utmMedium: typeof parsed.utmMedium === 'string' ? parsed.utmMedium : undefined,
      utmCampaign: typeof parsed.utmCampaign === 'string' ? parsed.utmCampaign : undefined,
    };
  } catch {
    return {};
  }
}
