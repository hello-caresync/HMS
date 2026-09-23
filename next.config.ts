import type { NextConfig } from 'next';

/**
 * Cloudflare Pages (@cloudflare/next-on-pages)
 *
 * - `trailingSlash: true` emits `/super-vault-access/index.html` so direct
 *   deep links resolve on static asset hosts.
 * - Do NOT set `output: 'export'` — this app uses edge runtime, middleware,
 *   and API routes; use `npm run build:cloudflare` for Pages deployment.
 */
const nextConfig: NextConfig = {
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
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
