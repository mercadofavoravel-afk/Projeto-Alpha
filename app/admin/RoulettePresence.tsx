'use client';

import { useEffect } from 'react';
import { alphaPath } from '@/lib/public-path';

// Presence only renews an explicit check-in. Opening the CRM never joins a draw.
export function RoulettePresence() {
  useEffect(() => {
    const pulse = () => {
      if (document.visibilityState !== 'visible') return;
      void fetch(alphaPath('/api/admin/roleta'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pulse' }),
      }).catch(() => undefined);
    };
    pulse();
    const timer = window.setInterval(pulse, 30_000);
    document.addEventListener('visibilitychange', pulse);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', pulse);
    };
  }, []);
  return null;
}
