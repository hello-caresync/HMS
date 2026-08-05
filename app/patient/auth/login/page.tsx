import { Suspense } from 'react';

import PatientLoginPageClient from './PatientLoginPageClient';

export default function PatientLoginPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-sm">Loading…</p>}>
      <PatientLoginPageClient />
    </Suspense>
  );
}
