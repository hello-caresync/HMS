'use client';

import type { ReactNode } from 'react';
import { EcosystemRouteGuard } from '@/components/auth/EcosystemRouteGuard';
import { SUPER_ADMIN_LOGIN_PATH } from '@/lib/auth/superAdminAuth';

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <EcosystemRouteGuard role="superadmin" loginPath={SUPER_ADMIN_LOGIN_PATH}>
      {children}
    </EcosystemRouteGuard>
  );
}
