'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { VENDOR_PORTAL_ROUTES } from '@/lib/vendor/navigation';

export default function VendorPortalIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(VENDOR_PORTAL_ROUTES.dashboard);
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-medium text-slate-600">
      Loading Nexora Vendor portal…
    </div>
  );
}
