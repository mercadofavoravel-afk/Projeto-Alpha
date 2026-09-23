import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

function getBasePath() {
  const configured = process.env.NEXT_PUBLIC_ALPHA_BASE_PATH;
  const normalized =
    configured?.trim().replace(/^\/+|\/+$/g, '') ??
    (process.env.NODE_ENV === 'production' ? 'alpha' : '');
  return normalized ? `/${normalized}` : undefined;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  basePath: getBasePath(),
  images: { unoptimized: true },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
