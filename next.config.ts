import type { NextConfig } from 'next';

/**
 * Cloudflare Pages (@cloudflare/next-on-pages)
 *
 * trailingSlash: true  → emits /super-vault-access/index.html for direct deep links
 * images.unoptimized   → required for static asset hosts
 *
 * Do NOT set output: 'export' — this app relies on edge runtime, middleware, and
 * Supabase client SDK auth. Deploy with: npm run build:cloudflare
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
