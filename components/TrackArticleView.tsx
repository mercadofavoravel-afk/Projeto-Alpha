'use client';

import { useEffect } from 'react';

import { getCampaignUtms } from '@/lib/campaign-attribution';
import { alphaPath } from '@/lib/public-path';

export function TrackArticleView({ articleSlug }: { articleSlug: string }) {
  useEffect(() => {
    let sessionKey: string | undefined;
    try {
      sessionKey = localStorage.getItem('alpha_session_key') || undefined;
      if (!sessionKey) {
        sessionKey = crypto.randomUUID();
        localStorage.setItem('alpha_session_key', sessionKey);
      }
    } catch {
      // Uma visita continua válida mesmo quando o navegador bloqueia armazenamento local.
    }

    const campaign = getCampaignUtms();

    void fetch(alphaPath('/api/analytics'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        name: 'article_view',
        path: location.pathname,
        sessionKey,
        metadata: { articleSlug, ...campaign },
      }),
    }).catch(() => undefined);
  }, [articleSlug]);

  return null;
}
