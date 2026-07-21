import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      { source: '/api/doctor/analytics', destination: '/api/analytics' },
      { source: '/api/doctor/documents', destination: '/api/documents/generate' },
      { source: '/api/doctor/ipd/notes', destination: '/api/ipd/soap-notes' },
      { source: '/api/doctor/lab-orders', destination: '/api/lab-orders' },
      { source: '/api/doctor/messages', destination: '/api/messages' },
      { source: '/api/doctor/notifications', destination: '/api/notifications' },
      { source: '/api/doctor/prescriptions', destination: '/api/prescriptions' },
    ];
  },
};

export default nextConfig;
