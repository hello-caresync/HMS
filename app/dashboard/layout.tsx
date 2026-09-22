'use client';

import type { ReactNode } from 'react';

import { EcosystemRouteGuard } from '@/components/auth/EcosystemRouteGuard';
import { HospitalAppShell } from '@/components/nexora-hospital/shell/HospitalAppShell';
import { HospitalRoleProvider } from '@/app/hospital/_components/HospitalRoleProvider';

/** `/dashboard` uses the enterprise shell sidebar only — no nested desk sidebar. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <EcosystemRouteGuard role="hospital" loginPath="/hospital/login">
      <HospitalRoleProvider>
        <HospitalAppShell>{children}</HospitalAppShell>
      </HospitalRoleProvider>
    </EcosystemRouteGuard>
  );
}
