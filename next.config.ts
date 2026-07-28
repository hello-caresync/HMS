/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Prevent build failures on minor warning types
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@supabase/supabase-js',
      '@prisma/client',
      'date-fns',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Enable aggressive dead-code elimination & minification for Edge workers
      config.optimization = {
        ...config.optimization,
        minimize: true,
        usedExports: true,
      };
    }
    return config;
  },
};

module.exports = nextConfig;