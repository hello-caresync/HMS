'use client';

import type { ReactNode } from 'react';

import { EcosystemRouteGuard } from '@/components/auth/EcosystemRouteGuard';
import { VendorShell } from '@/components/vendor/VendorShell';
import { VENDOR_PORTAL_ROUTES } from '@/lib/vendor/navigation';

export default function VendorPortalShellLayout({ children }: { children: ReactNode }) {
  return (
    <EcosystemRouteGuard role="vendor" loginPath={VENDOR_PORTAL_ROUTES.login}>
      <VendorShell>{children}</VendorShell>
    </EcosystemRouteGuard>
  );
}
