import { Suspense } from 'react';

import SuperVaultClient from './SuperVaultClient';

function SuperVaultAccessFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
      Loading hospital credential vault…
    </div>
  );
}

export default function SuperVaultAccessPage() {
  return (
    <Suspense fallback={<SuperVaultAccessFallback />}>
      <SuperVaultClient />
    </Suspense>
  );
}
