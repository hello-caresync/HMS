'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import { VendorPortalLoginForm } from '@/components/vendor/VendorPortalLoginForm';
import { VENDOR_PORTAL_ROUTES } from '@/lib/vendor/navigation';

export default function VendorPortalLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      }
    >
      <VendorPortalLoginForm redirectTo={VENDOR_PORTAL_ROUTES.dashboard} />
    </Suspense>
  );
}
