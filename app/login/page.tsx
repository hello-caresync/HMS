'use client';

import { Suspense } from 'react';

import StaffLoginForm from './_components/StaffLoginForm';

/**
 * Dev mock credentials (local only):
 *   Email:    hospital@curasync.com
 *   Password: 123456
 * → Issues session and redirects to /hospital/dashboard
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800">
          <p className="font-mono text-xs uppercase tracking-wider">Initializing secure gateway…</p>
        </div>
      }
    >
      <StaffLoginForm />
    </Suspense>
  );
}
