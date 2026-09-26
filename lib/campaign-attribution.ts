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

function matchesHost(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

// A referrer identifies a platform, never the visitor's search query or an ad campaign.
export function sourceFromReferrer(referrer: string, siteOrigin: string): CampaignUtms {
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    const ownHost = new URL(siteOrigin).hostname.toLowerCase();

    if (!['https:', 'http:'].includes(url.protocol) || matchesHost(host, ownHost)) return {};

    if (/^(?:[^.]+\.)?google\.(?:com(?:\.[a-z]{2})?|[a-z]{2,3}(?:\.[a-z]{2})?)$/.test(host)) {
      return url.pathname.startsWith('/maps') || host.startsWith('maps.')
        ? { utmSource: 'google_maps', utmMedium: 'referral' }
        : { utmSource: 'google', utmMedium: 'organic' };
    }

    if (matchesHost(host, 'bing.com')) return { utmSource: 'bing', utmMedium: 'organic' };
    if (matchesHost(host, 'ecosia.org')) return { utmSource: 'ecosia', utmMedium: 'organic' };

    const platforms: Array<[string, string, string]> = [
      ['instagram.com', 'instagram', 'social'],
      ['tiktok.com', 'tiktok', 'social'],
      ['kwai.com', 'kwai', 'social'],
      ['linkedin.com', 'linkedin', 'social'],
      ['youtube.com', 'youtube', 'social'],
      ['youtu.be', 'youtube', 'social'],
      ['facebook.com', 'facebook', 'social'],
      ['zapimoveis.com.br', 'zapimoveis', 'referral'],
      ['vivareal.com.br', 'vivareal', 'referral'],
      ['olx.com.br', 'olx', 'referral'],
      ['maps.apple.com', 'apple_maps', 'referral'],
    ];

    for (const [domain, source, medium] of platforms) {
      if (matchesHost(host, domain)) return { utmSource: source, utmMedium: medium };
    }
  } catch {
    // A missing or malformed referrer is not evidence of a platform.
  }

  return {};
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
    if (saved) {
      const parsed: CampaignUtms = JSON.parse(saved);
      return {
        utmSource: typeof parsed.utmSource === 'string' ? parsed.utmSource : undefined,
        utmMedium: typeof parsed.utmMedium === 'string' ? parsed.utmMedium : undefined,
        utmCampaign: typeof parsed.utmCampaign === 'string' ? parsed.utmCampaign : undefined,
      };
    }
  } catch {
    // Storage may be unavailable. The referrer can still identify a known source.
  }

  const inferred = sourceFromReferrer(window.document.referrer, window.location.origin);
  if (inferred.utmSource) {
    try {
      window.sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(inferred));
    } catch {
      // Do not block the lead form when browser storage is unavailable.
    }
  }

  return inferred;
}
