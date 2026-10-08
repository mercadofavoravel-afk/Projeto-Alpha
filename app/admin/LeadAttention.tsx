'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { alphaPath } from '@/lib/public-path';

type RiskCounts = {
  unassigned?: number;
  firstContact?: number;
  overdueFollowUp?: number;
  stalled?: number;
};

const intervalMs = 60_000;

export function LeadAttention() {
  const [counts, setCounts] = useState<RiskCounts | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const response = await fetch(alphaPath('/api/admin/leads/risks'), {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (!response.ok) return;
        const next = (await response.json()) as RiskCounts;
        if (active) setCounts(next);
      } catch {
        // Keep the last known count; the CRM remains usable if polling is unavailable.
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), intervalMs);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  if (!counts) return null;
  const items = [
    ['Sem responsável', counts.unassigned],
    ['Primeiro contato', counts.firstContact],
    ['Acompanhamento vencido', counts.overdueFollowUp],
    ['Parados 48 h', counts.stalled],
  ].filter((item): item is [string, number] => typeof item[1] === 'number' && item[1] > 0);
  if (items.length === 0) return null;

  return (
    <div className="notice" role="status" aria-live="polite">
      <strong>Leads que precisam de atenção: </strong>
      {items.map(([label, count], index) => (
        <span key={label}>
          {index > 0 ? ' · ' : ''}
          {count} {label.toLowerCase()}
        </span>
      ))}
      {' · '}
      <Link href="/admin/leads">Ver a fila</Link>
    </div>
  );
}
