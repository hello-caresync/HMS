'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import StaffLoginForm from './_components/StaffLoginForm';

/**
 * Unified Nexora Hospital login portal.
 * Dev mock: hospital@curasync.com / 123456
 * Production: credentials issued via /admin/onboarding
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-800">
          <Loader2 className="h-8 w-8 animate-spin text-teal-800" aria-hidden />
          <p className="text-sm font-bold uppercase tracking-wider">
            Initializing secure gateway…
          </p>
        </div>
      }
    >
      <StaffLoginForm />
    </Suspense>
  );
}
