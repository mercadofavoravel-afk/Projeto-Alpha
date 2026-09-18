import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

function getBasePath() {
  const normalized = process.env.NEXT_PUBLIC_ALPHA_BASE_PATH?.trim().replace(/^\/+|\/+$/g, '') ?? '';
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
