'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { getCampaignUtms } from '@/lib/campaign-attribution';

export function CaptureCampaign() {
  const pathname = usePathname();

  useEffect(() => {
    getCampaignUtms();
  }, [pathname]);

  return null;
}
