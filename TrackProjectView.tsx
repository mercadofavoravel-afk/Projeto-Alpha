'use client';
import { useEffect } from 'react';
export function TrackProjectView({ projectId }: { projectId: string }) {
  useEffect(() => {
    let k = localStorage.getItem('alpha_session_key');
    if (!k) {
      k = crypto.randomUUID();
      localStorage.setItem('alpha_session_key', k);
    }
    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        name: 'project_view',
        path: location.pathname,
        sessionKey: k,
        projectId,
      }),
    });
  }, [projectId]);
  return null;
}
