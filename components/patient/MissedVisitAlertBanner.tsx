'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';

import type { DashboardVisit } from '@/components/patient/DashboardOverview';

type MissedVisitRescheduleCardProps = {
  visit: DashboardVisit;
  onReschedule: (visit: DashboardVisit) => void;
};

/** Sidebar reschedule alert — shown when a consultation window has expired. */
export function MissedVisitRescheduleCard({ visit, onReschedule }: MissedVisitRescheduleCardProps) {
  return (
    <section
      className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-5 shadow-sm backdrop-blur-sm"
      role="alert"
      aria-label="Missed consultation reschedule notice"
    >
      <div className="mb-3 flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
        <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
          VISIT WINDOW EXPIRED · RESCHEDULE NEEDED
        </span>
      </div>

      <p className="text-xs leading-relaxed text-amber-950">
        Your scheduled OPD consultation with{' '}
        <span className="font-bold">{visit.doctor_name}</span> was missed. Select a new convenient
        time slot to retain your queue priority.
      </p>

      <p className="mt-2 text-[11px] text-amber-900/70">
        Need immediate care today? Visit OPD Reception (Counter 2) for a walk-in token.
      </p>

      <button
        type="button"
        onClick={() => onReschedule(visit)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-xs font-medium text-amber-950 shadow-sm transition-all hover:bg-amber-400"
      >
        <RefreshCcw className="h-4 w-4" aria-hidden />
        Reschedule Now
      </button>
    </section>
  );
}

/** @deprecated Use MissedVisitRescheduleCard for sidebar placement. */
export const MissedVisitAlertBanner = MissedVisitRescheduleCard;

export default MissedVisitRescheduleCard;
