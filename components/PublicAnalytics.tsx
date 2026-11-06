'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const MEASUREMENT_ID = 'G-WMFPWVJ51L';

// Load the existing site's stream only on its public production host.
// Enhanced Measurement already tracks history changes for this stream;
// do not also dispatch page_view from React effects.
export function PublicAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(
      /^(www\.)?imoveisdealtopadraorio\.com\.br$/.test(window.location.hostname),
    );
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script id="alpha-ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${MEASUREMENT_ID}', {
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});`}
      </Script>
      <Script
        id="alpha-ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}
