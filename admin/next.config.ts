import type { NextConfig } from 'next';

const apiOrigin =
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:4000';

const marketplaceOrigin =
  process.env.MARKETPLACE_ORIGIN || 'http://127.0.0.1:3000';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '127.0.0.1', port: '9000' },
      { protocol: 'http', hostname: 'localhost', port: '9000' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: `${apiOrigin.replace(/\/$/, '')}/:path*`,
      },
      // Seeded brand logos live in the marketplace public/ folder.
      {
        source: '/brands/:path*',
        destination: `${marketplaceOrigin.replace(/\/$/, '')}/brands/:path*`,
      },
    ];
  },
};

export default nextConfig;
