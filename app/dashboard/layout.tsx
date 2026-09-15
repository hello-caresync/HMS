'use client';

import type { ReactNode } from 'react';
import { EcosystemRouteGuard } from '@/components/auth/EcosystemRouteGuard';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <EcosystemRouteGuard role="hospital" loginPath="/hospital/login">
      {children}
    </EcosystemRouteGuard>
  );
}
