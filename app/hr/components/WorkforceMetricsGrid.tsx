'use client';

import { AlertTriangle, CalendarClock, UserCheck, Users } from 'lucide-react';

import { useHr } from '../context/HrProvider';

export default function WorkforceMetricsGrid() {
  const { metrics } = useHr();

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total Active Staff"
        value={String(metrics.totalActiveStaff)}
        icon={Users}
        accent="text-slate-900 bg-slate-100"
      />
      <MetricCard
        label="Staff On-Duty Now"
        value={String(metrics.staffOnDutyNow)}
        icon={UserCheck}
        accent="text-emerald-700 bg-emerald-100"
      />
      <MetricCard
        label="Pending Leave Requests"
        value={String(metrics.pendingLeaveRequests)}
        icon={CalendarClock}
        accent="text-violet-700 bg-violet-100"
        warn={metrics.pendingLeaveRequests > 0}
      />
      <MetricCard
        label="Upcoming Shift Overlaps"
        value={String(metrics.upcomingShiftOverlaps)}
        icon={AlertTriangle}
        accent="text-amber-700 bg-amber-100"
        warn={metrics.upcomingShiftOverlaps > 0}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  warn,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  accent: string;
  warn?: boolean;
}) {
  const [textColor, bgColor] = accent.split(' ');
  return (
    <div
      className={`rounded-lg border bg-white p-3 shadow-sm ${warn ? 'border-amber-300' : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">{label}</p>
          <p className={`mt-1 font-mono text-lg font-bold tabular-nums ${textColor}`}>{value}</p>
        </div>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgColor}`}>
          <Icon className={`h-4 w-4 ${textColor}`} />
        </span>
      </div>
    </div>
  );
}
