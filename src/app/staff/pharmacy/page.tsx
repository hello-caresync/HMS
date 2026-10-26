'use client';

import { EcosystemRouteGuard } from '@/components/auth/EcosystemRouteGuard';
import { getStaffPortalSession } from '@/lib/auth/ecosystem-sessions';
import { Pill, Package } from 'lucide-react';

export default function StaffPharmacyPage() {
  const session = getStaffPortalSession();

  return (
    <EcosystemRouteGuard role="staff" loginPath="/staff/login">
      <div className="min-h-screen bg-slate-50 p-6 font-sans sm:p-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-3xl border border-teal-200 bg-white p-8 shadow-sm">
            <p className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">Pharmacy Desk</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Central Dispensary</h1>
            <p className="mt-2 text-sm text-slate-500">
              Pharmacist: {session?.full_name ?? 'Staff'} • {session?.hospital_name}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <Pill className="mb-2 h-6 w-6 text-teal-600" />
              <h2 className="font-bold">Digital Rx Fulfillment</h2>
              <p className="mt-1 text-xs text-slate-500">Process doctor prescriptions in real time.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <Package className="mb-2 h-6 w-6 text-indigo-600" />
              <h2 className="font-bold">Inventory Sync</h2>
              <p className="mt-1 text-xs text-slate-500">Track medicine batch availability and alerts.</p>
            </div>
          </div>
        </div>
      </div>
    </EcosystemRouteGuard>
  );
}
