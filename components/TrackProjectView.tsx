'use client';

import { useEffect } from 'react';

export function TrackProjectView({ projectSlug }: { projectSlug: string }) {
  useEffect(() => {
    let sessionKey = localStorage.getItem('alpha_session_key');
    if (!sessionKey) {
      sessionKey = crypto.randomUUID();
      localStorage.setItem('alpha_session_key', sessionKey);
    }

    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        name: 'project_view',
        path: location.pathname,
        sessionKey,
        metadata: { projectSlug },
      }),
    });
  }, [projectSlug]);

  return null;
}
