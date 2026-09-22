'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';

import { SuperAdminHospitalBlocksDashboard } from '@/app/super-admin/staff-credentials/page';

function SuperAdminTenantDetailPageInner() {
  const params = useParams<{ id?: string }>();
  const tenantId =
    typeof params?.id === 'string' ? decodeURIComponent(params.id).trim() : undefined;

  return <SuperAdminHospitalBlocksDashboard initialTenantIdentifier={tenantId} />;
}

export default function SuperAdminTenantDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
          Loading hospital tenant vault…
        </div>
      }
    >
      <SuperAdminTenantDetailPageInner />
    </Suspense>
  );
}
