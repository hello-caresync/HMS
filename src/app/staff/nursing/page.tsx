'use client';

import { EcosystemRouteGuard } from '@/components/auth/EcosystemRouteGuard';
import { getStaffPortalSession } from '@/lib/auth/ecosystem-sessions';
import { Activity, Users } from 'lucide-react';

type StaffWorkspaceProps = {
  title: string;
  subtitle: string;
};

function StaffWorkspaceShell({ title, subtitle }: StaffWorkspaceProps) {
  const session = getStaffPortalSession();

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans sm:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-indigo-200 bg-white p-8 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">Staff Workspace</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          <p className="mt-4 text-xs font-semibold text-slate-600">
            Signed in as {session?.full_name ?? 'Staff Member'} • {session?.hospital_name}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <Users className="mb-2 h-6 w-6 text-indigo-600" />
            <h2 className="font-bold text-slate-900">Live Queue Panel</h2>
            <p className="mt-1 text-xs text-slate-500">Monitor assigned patients and triage tasks.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <Activity className="mb-2 h-6 w-6 text-teal-600" />
            <h2 className="font-bold text-slate-900">Department Operations</h2>
            <p className="mt-1 text-xs text-slate-500">Role-scoped tools for your assigned hospital node.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffNursingPage() {
  return (
    <EcosystemRouteGuard role="staff" loginPath="/staff/login">
      <StaffWorkspaceShell title="Nursing Station" subtitle="Triage, vitals capture, and ward coordination." />
    </EcosystemRouteGuard>
  );
}
