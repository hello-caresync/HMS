'use client';

import React, { Suspense } from 'react';

import StaffLoginForm from './_components/StaffLoginForm';

/**
 * Dev mock credentials (local only — bypasses IAM / database):
 *   Email:    hospital@curasync.com
 *   Password: 123456
 * → Issues hospital_admin session and redirects to /dashboard
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-800">
          <p className="font-mono text-xs uppercase tracking-wider">Initializing IAM gateway…</p>
        </div>
      }
    >
      <StaffLoginForm />
    </Suspense>
  );
}
