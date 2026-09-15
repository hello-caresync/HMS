'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import { VendorPortalLoginForm } from '@/components/vendor/VendorPortalLoginForm';
import { VENDOR_PORTAL_ROUTES } from '@/lib/vendor/navigation';

export default function VendorLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        </div>
      }
    >
      <VendorPortalLoginForm redirectTo={VENDOR_PORTAL_ROUTES.dashboard} />
    </Suspense>
  );
}
