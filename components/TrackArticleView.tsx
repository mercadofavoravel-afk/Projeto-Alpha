'use client';

import { useEffect } from 'react';

import { getCampaignUtms, sameSiteReferrerPath } from '@/lib/campaign-attribution';
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

    function track(name: 'article_view' | 'article_contact_click') {
      const campaign = getCampaignUtms();
      void fetch(alphaPath('/api/analytics'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          name,
          path: location.pathname,
          sessionKey,
          metadata: {
            articleSlug,
            ...campaign,
            referrerPath: sameSiteReferrerPath(document.referrer, location.origin),
          },
        }),
      }).catch(() => undefined);
    }
    track('article_view');
    const click = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      try {
        const url = new URL(anchor.href);
        const samePageContact =
          url.origin === location.origin &&
          url.pathname === location.pathname &&
          url.hash === '#atendimento';
        const externalContact = [
          'wa.me',
          'api.whatsapp.com',
          'form.respondi.app',
          'tintim.app',
        ].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
        if (samePageContact || externalContact) track('article_contact_click');
      } catch {
        /* Invalid destinations never block navigation. */
      }
    };
    document.addEventListener('click', click);
    return () => document.removeEventListener('click', click);
  }, [articleSlug]);

  return null;
}
