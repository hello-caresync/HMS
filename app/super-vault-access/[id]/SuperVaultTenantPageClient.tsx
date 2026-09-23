'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';

import { SuperAdminHospitalBlocksDashboard } from '@/app/super-admin/staff-credentials/page';

function SuperVaultTenantPageInner() {
  const params = useParams<{ id?: string }>();
  const tenantId =
    typeof params?.id === 'string' ? decodeURIComponent(params.id).trim() : undefined;

  return <SuperAdminHospitalBlocksDashboard initialTenantIdentifier={tenantId} />;
}

export default function SuperVaultTenantPageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
          Loading hospital credential vault…
        </div>
      }
    >
      <SuperVaultTenantPageInner />
    </Suspense>
  );
}
