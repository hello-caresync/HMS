'use client';

import { Toaster } from 'sonner';

import { AuthProvider } from '@/app/context/AuthProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </AuthProvider>
  );
}
