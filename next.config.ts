import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@supabase/supabase-js',
      '@prisma/client',
    ],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
