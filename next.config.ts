import type { NextConfig } from 'next';

/**
 * Cloudflare Workers / Pages via @opennextjs/cloudflare
 *
 * Do NOT set output: 'export' — this app uses middleware, API routes, and SSR.
 * Deploy with: npm run pages:build  (output: .open-next/assets + worker)
 */
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR?.trim() || '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: process.env.CF_PAGES === '1',
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();
