'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';

import type { DashboardVisit } from '@/components/patient/DashboardOverview';

type MissedVisitAlertBannerProps = {
  visit: DashboardVisit;
  onReschedule: (visit: DashboardVisit) => void;
};

export function MissedVisitAlertBanner({ visit, onReschedule }: MissedVisitAlertBannerProps) {
  return (
    <section
      className="rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 via-amber-50/90 to-orange-50 p-5 shadow-sm backdrop-blur-sm"
      role="alert"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-950">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Visit Window Expired · Reschedule Needed
          </div>
          <p className="text-sm leading-relaxed text-amber-950">
            Your scheduled OPD consultation with{' '}
            <span className="font-bold">{visit.doctor_name}</span> was missed. Please select a new
            convenient time slot to retain your consultation queue priority.
          </p>
          <p className="text-xs text-amber-900/80">
            Need immediate care today?{' '}
            <span className="font-semibold">Visit OPD Reception (Counter 2) for a walk-in token.</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onReschedule(visit)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-400 bg-amber-200 px-5 py-2.5 text-xs font-bold text-amber-950 shadow-sm transition hover:bg-amber-300"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden />
          Reschedule Now
        </button>
      </div>
    </section>
  );
}

export default MissedVisitAlertBanner;
