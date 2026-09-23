import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cloudflare Pages: emit /super-vault-access/index.html for direct URL hits
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
