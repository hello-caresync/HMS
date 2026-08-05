'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { HospitalAppShell } from '@/components/nexora-hospital/shell/HospitalAppShell';
import { isHospitalShellRoute } from '@/lib/nexora-hospital/navigation';

import HospitalPortalLayout from './HospitalPortalLayout';
import HospitalPortalSyncLayout from './HospitalPortalSyncLayout';

export default function HospitalLayoutRouter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const enterprise = isHospitalShellRoute(pathname);

  if (enterprise) {
    return <HospitalAppShell>{children}</HospitalAppShell>;
  }

  return (
    <HospitalPortalSyncLayout>
      <HospitalPortalLayout>{children}</HospitalPortalLayout>
    </HospitalPortalSyncLayout>
  );
}
