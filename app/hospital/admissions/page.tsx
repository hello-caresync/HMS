import { Suspense } from 'react';

import { AdmissionsWorkspace } from '@/components/nexora-hospital/workspaces/AdmissionsWorkspace';

export const dynamic = 'force-dynamic';

function AdmissionsLoading() {
  return (
    <div className="p-8 text-center text-sm text-stone-500">Loading admissions…</div>
  );
}

export default function HospitalAdmissionsPage() {
  return (
    <Suspense fallback={<AdmissionsLoading />}>
      <AdmissionsWorkspace />
    </Suspense>
  );
}
