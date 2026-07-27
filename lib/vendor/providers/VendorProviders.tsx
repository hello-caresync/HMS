'use client';

import type { ReactNode } from 'react';

import { useVendorRealtime } from '@/lib/vendor/hooks/useVendorRealtime';
import { useVendorAppStore } from '@/lib/vendor/store/vendor-app-store';

export function VendorProviders({ children }: { children: ReactNode }) {
  const theme = useVendorAppStore((s) => s.theme);
  useVendorRealtime();

  return (
    <div className={theme === 'dark' ? 'dark' : ''} data-vendor-theme={theme}>
      {children}
    </div>
  );
}
