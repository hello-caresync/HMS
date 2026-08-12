'use client';

import dynamic from 'next/dynamic';
import { Activity } from 'lucide-react';

const DoctorWorkspace = dynamic(
  () =>
    import('@/components/doctor/DoctorWorkspace').then((mod) => mod.DoctorWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-300">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-6 py-4 text-xs font-semibold">
          <Activity className="h-4 w-4 animate-pulse text-purple-400" />
          Loading clinical workspace…
        </div>
      </div>
    ),
  },
);

export default function DoctorDashboardPage() {
  return <DoctorWorkspace />;
}
