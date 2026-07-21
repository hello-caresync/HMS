'use client';

import type { ReactNode } from 'react';

import { PatientShell } from '@/components/patient/PatientShell';
import { PatientProviders } from '@/lib/patient/providers/PatientProviders';

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <PatientProviders>
      <PatientShell>{children}</PatientShell>
    </PatientProviders>
  );
}
