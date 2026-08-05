'use client';

import type { ReactNode } from 'react';

import { HospitalSyncProvider } from '@/lib/nexora-hospital/HospitalSyncProvider';
import { useHospitalInit } from '@/lib/nexora-hospital/hooks';

function HospitalPortalBootstrap({ children }: { children: ReactNode }) {
  useHospitalInit();
  return (
    <>
      <HospitalSyncProvider />
      {children}
    </>
  );
}

export default function HospitalPortalSyncLayout({ children }: { children: ReactNode }) {
  return <HospitalPortalBootstrap>{children}</HospitalPortalBootstrap>;
}
