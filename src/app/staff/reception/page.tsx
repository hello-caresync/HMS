'use client';

import { EcosystemRouteGuard } from '@/components/auth/EcosystemRouteGuard';
import { getStaffPortalSession } from '@/lib/auth/ecosystem-sessions';
import { ClipboardList, UserCheck } from 'lucide-react';

export default function StaffReceptionPage() {
  const session = getStaffPortalSession();

  return (
    <EcosystemRouteGuard role="staff" loginPath="/staff/login">
      <div className="min-h-screen bg-slate-50 p-6 font-sans sm:p-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-3xl border border-violet-200 bg-white p-8 shadow-sm">
            <p className="text-[10px] font-bold tracking-widest text-violet-600 uppercase">Front Desk</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Reception & Patient Intake</h1>
            <p className="mt-2 text-sm text-slate-500">
              Receptionist: {session?.full_name ?? 'Staff'} • {session?.hospital_name}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <ClipboardList className="mb-2 h-6 w-6 text-violet-600" />
              <h2 className="font-bold">Walk-In Token Desk</h2>
              <p className="mt-1 text-xs text-slate-500">Issue tokens and assign consulting rooms.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <UserCheck className="mb-2 h-6 w-6 text-indigo-600" />
              <h2 className="font-bold">Live Check-In Monitor</h2>
              <p className="mt-1 text-xs text-slate-500">Track patient arrivals and queue position.</p>
            </div>
          </div>
        </div>
      </div>
    </EcosystemRouteGuard>
  );
}
