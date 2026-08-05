'use client';

import { Activity, Clock, Star, Stethoscope, TrendingUp, UserX, Users } from 'lucide-react';

import { opdUi } from '@/lib/opd/design-tokens';
import { useEcosystemStore } from '@/lib/ecosystem/store';

export function OpdAnalyticsDashboard() {
  const analytics = useEcosystemStore((s) => s.opdAnalytics);
  const refresh = useEcosystemStore((s) => s.refreshOpdMetrics);

  const metrics = [
    { label: 'Patients Today', value: analytics.totalPatientsToday, icon: Users },
    { label: 'Avg Wait Time', value: `${analytics.avgWaitMinutes} min`, icon: Clock },
    { label: 'Avg Consult Duration', value: `${analytics.avgConsultMinutes} min`, icon: Stethoscope },
    { label: 'Doctor Utilization', value: `${analytics.doctorUtilizationPct}%`, icon: Activity },
    { label: 'Peak Traffic Hour', value: analytics.peakHour, icon: TrendingUp },
    { label: 'No-Show Rate', value: `${analytics.noShowRatePct}%`, icon: UserX },
    { label: 'Patient Satisfaction', value: `${analytics.avgSatisfactionRating} / 5`, icon: Star },
    { label: 'Waiting Hall Occupancy', value: `${analytics.waitingHallOccupancyPct}%`, icon: Users },
  ];

  return (
    <div className={`${opdUi.canvas} min-h-screen p-6`}>
      <header className={`${opdUi.topBar} mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-4`}>
        <div>
          <h1 className="text-xl font-black">OPD Analytics · Admin Panel</h1>
          <p className="text-sm text-white/80">Real-time operational metrics across all branches</p>
        </div>
        <button type="button" onClick={refresh} className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/25">
          Refresh
        </button>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <article key={label} className={`${opdUi.card} p-6`}>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#572E54]/10 p-3 text-[#572E54]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#8E7692]">{label}</p>
                <p className="text-2xl font-black text-[#482A41]">{value}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-6xl text-xs text-[#8E7692]">
        Last updated {new Date(analytics.updatedAt).toLocaleString()} · Metrics sync via realtime event bus
      </p>
    </div>
  );
}
