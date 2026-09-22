'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { HospitalAppShell } from '@/components/nexora-hospital/shell/HospitalAppShell';
import { isHospitalShellRoute } from '@/lib/nexora-hospital/navigation';

import { HospitalRoleProvider } from './HospitalRoleProvider';
import HospitalPortalLayout from './HospitalPortalLayout';
import HospitalPortalSyncLayout from './HospitalPortalSyncLayout';

export default function HospitalLayoutRouter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const enterprise = isHospitalShellRoute(pathname);

  return (
    <HospitalRoleProvider>
      {enterprise ? (
        <HospitalAppShell>{children}</HospitalAppShell>
      ) : (
        <HospitalPortalSyncLayout>
          <HospitalPortalLayout>{children}</HospitalPortalLayout>
        </HospitalPortalSyncLayout>
      )}
    </HospitalRoleProvider>
  );
}
