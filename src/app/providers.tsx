'use client';

import { Toaster } from 'sonner';

import { PortalFieldGuard } from '@/components/forms/PortalFieldGuard';
import { AuthProvider } from '@/src/app/context/AuthProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortalFieldGuard />
      {children}
      <Toaster richColors closeButton position="top-right" />
    </AuthProvider>
  );
}
