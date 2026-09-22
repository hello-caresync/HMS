'use client';

import { Activity, Building2, CalendarCheck } from 'lucide-react';

type PrescriptionMetricsRowProps = {
  pendingCount: number;
  prescriptionCount: number;
  facilityLabel?: string;
};

export function PrescriptionMetricsRow({
  pendingCount,
  prescriptionCount,
  facilityLabel = 'Regal Hospital · HOSP-01',
}: PrescriptionMetricsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-sky-100 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-1 flex items-center gap-2 text-sky-700">
          <CalendarCheck className="h-4 w-4" aria-hidden />
          <span className="text-[10px] font-bold uppercase tracking-wider">Active Booking</span>
        </div>
        <p className="text-sm font-bold text-slate-900">
          {pendingCount > 0
            ? `${pendingCount} Scheduled Visit${pendingCount === 1 ? '' : 's'}`
            : `${prescriptionCount} Prescription${prescriptionCount === 1 ? '' : 's'} on Record`}
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-1 flex items-center gap-2 text-emerald-700">
          <Activity className="h-4 w-4" aria-hidden />
          <span className="text-[10px] font-bold uppercase tracking-wider">Triage Status</span>
        </div>
        <p className="text-sm font-bold text-slate-900">
          {pendingCount > 0 ? 'Priority Normal · OPD Regular' : 'Clinical Record · Dispatched'}
        </p>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-1 flex items-center gap-2 text-amber-800">
          <Building2 className="h-4 w-4" aria-hidden />
          <span className="text-[10px] font-bold uppercase tracking-wider">Care Facility</span>
        </div>
        <p className="text-sm font-bold text-slate-900">{facilityLabel}</p>
      </div>
    </div>
  );
}

export default PrescriptionMetricsRow;
