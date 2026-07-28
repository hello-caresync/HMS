import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Ignore TypeScript errors during production build if needed
    ignoreBuildErrors: true,
  },
  // Tells Next.js 16 Turbopack to proceed smoothly
  turbopack: {},
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@supabase/supabase-js',
      '@prisma/client',
      'date-fns',
    ],
  },
};

export default nextConfig;