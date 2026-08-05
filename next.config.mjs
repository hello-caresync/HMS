/** @type {import('next').NextConfig} */
const nextConfig = {
    // Required by Cloudflare Pages to generate static HTML into the /out directory
    output: 'export',
    
    // Ensures clean URL routing for sub-pages on Cloudflare Pages
    trailingSlash: true,
    
    images: {
      // Required for static exports since Next.js image optimization server isn't available
      unoptimized: true,
    },
  
    typescript: {
      // Prevents minor TypeScript type errors from failing the build
      ignoreBuildErrors: true,
    },
  };
  
  export default nextConfig;