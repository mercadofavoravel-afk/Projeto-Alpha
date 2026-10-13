'use client';

import { getCampaignUtms } from '@/lib/campaign-attribution';

type Props = { articleSlug: string; respondiUrl?: string | null; tintimUrl?: string | null };

export function ArticleExternalCapture({ articleSlug, respondiUrl, tintimUrl }: Props) {
  function destination(base: string) {
    const url = new URL(base);
    const utms = getCampaignUtms();
    if (utms.utmSource) url.searchParams.set('utm_source', utms.utmSource);
    if (utms.utmMedium) url.searchParams.set('utm_medium', utms.utmMedium);
    if (utms.utmCampaign) url.searchParams.set('utm_campaign', utms.utmCampaign);
    url.searchParams.set('utm_content', `artigo:${articleSlug}`);
    return url.toString();
  }

  if (!respondiUrl && !tintimUrl) return null;
  return (
    <div className="article-external-capture">
      {respondiUrl && (
        <a
          href={respondiUrl}
          onClick={(event) => {
            event.currentTarget.href = destination(respondiUrl);
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Responder pelo formulário Respondi →
        </a>
      )}
      {tintimUrl && (
        <a href={tintimUrl} target="_blank" rel="noopener noreferrer">
          Iniciar conversa pelo WhatsApp →
        </a>
      )}
    </div>
  );
}
