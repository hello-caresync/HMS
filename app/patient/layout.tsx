'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';

import { PatientShell } from '@/components/patient/PatientShell';
import { PatientAuthGuard, PatientAuthProvider } from '@/lib/patient/auth/PatientAuthProvider';
import { PatientProviders } from '@/lib/patient/providers/PatientProviders';

export default function PatientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/patient/auth');

  return (
    <PatientProviders>
      <PatientAuthProvider>
        {isAuthRoute ? (
          children
        ) : (
          <PatientAuthGuard>
            <PatientShell>{children}</PatientShell>
            <Toaster position="top-right" closeButton />
          </PatientAuthGuard>
        )}
      </PatientAuthProvider>
    </PatientProviders>
  );
}
