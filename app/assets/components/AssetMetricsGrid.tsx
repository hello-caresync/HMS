'use client';

import { AlertTriangle, ClipboardCheck, Cpu, Wrench } from 'lucide-react';

import { useAssets } from '../context/AssetsProvider';

export default function AssetMetricsGrid() {
  const { metrics } = useAssets();

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total Tracked Assets"
        value={String(metrics.totalTrackedAssets)}
        icon={Cpu}
        accent="text-slate-900 bg-slate-100"
      />
      <MetricCard
        label="Out-of-Service"
        value={String(metrics.outOfService)}
        icon={Wrench}
        accent="text-rose-700 bg-rose-100"
        warn={metrics.outOfService > 0}
      />
      <MetricCard
        label="Calibrations Due (7 Days)"
        value={String(metrics.calibrationsDue7Days)}
        icon={ClipboardCheck}
        accent="text-amber-700 bg-amber-100"
        warn={metrics.calibrationsDue7Days > 0}
      />
      <MetricCard
        label="Active Maintenance Tickets"
        value={String(metrics.activeMaintenanceTickets)}
        icon={AlertTriangle}
        accent="text-violet-700 bg-violet-100"
        warn={metrics.activeMaintenanceTickets > 0}
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
  icon: typeof Cpu;
  accent: string;
  warn?: boolean;
}) {
  const [textColor, bgColor] = accent.split(' ');
  return (
    <div
      className={`rounded-lg border bg-white p-3 shadow-sm ${warn ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'}`}
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
