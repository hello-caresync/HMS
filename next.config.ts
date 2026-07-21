import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true }, // Required: disables runtime image processing
};

export default nextConfig;
