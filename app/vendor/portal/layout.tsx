'use client';

import type { ReactNode } from 'react';

import { VendorErrorBoundary } from '@/components/vendor/VendorErrorBoundary';
import { VendorShell } from '@/components/vendor/VendorShell';
import { VendorProviders } from '@/lib/vendor/providers/VendorProviders';

export default function VendorPortalRootLayout({ children }: { children: ReactNode }) {
  return (
    <VendorProviders>
      <VendorErrorBoundary>{children}</VendorErrorBoundary>
    </VendorProviders>
  );
}
