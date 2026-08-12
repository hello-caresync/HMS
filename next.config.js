/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages static HTML export → /out
  output: 'export',

  // Trailing-slash routes so /doctor/dashboard/ maps to doctor/dashboard/index.html
  trailingSlash: true,

  images: {
    unoptimized: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Avoid Turbopack picking a parent lockfile as the workspace root
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
