'use client';

import type { ReactNode } from 'react';

import { EcosystemRouteGuard } from '@/components/auth/EcosystemRouteGuard';

/** `/dashboard` renders the self-contained Regal Command Center — no outer app shell sidebar. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <EcosystemRouteGuard role="hospital" loginPath="/hospital/login">
      {children}
    </EcosystemRouteGuard>
  );
}
