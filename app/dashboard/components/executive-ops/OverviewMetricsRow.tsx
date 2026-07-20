'use client';

import { Activity, BedDouble, IndianRupee, Users } from 'lucide-react';

import { formatCompact, formatInr } from '../../lib/executiveOperationsData';
import type { ExecutiveOperationsData } from '../../types/executiveOperations';
import { ExecutivePanel, MetricValue, SplitMetricRow } from './executiveUi';

type OverviewMetricsRowProps = {
  data: Pick<ExecutiveOperationsData, 'occupancy' | 'beds' | 'staffing' | 'financial'>;
};

export default function OverviewMetricsRow({ data }: OverviewMetricsRowProps) {
  const { occupancy, beds, staffing, financial } = data;
  const bedPct = Math.round((beds.occupied / beds.total) * 100);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <ExecutivePanel title="Live Hospital Occupancy" icon={Activity} dense>
        <MetricValue value={occupancy.totalToday} label="Total Patients Today" accent />
        <SplitMetricRow
          items={[
            { label: 'OPD', value: occupancy.opd, highlight: true },
            { label: 'IPD', value: occupancy.ipd },
            { label: 'ER', value: occupancy.emergency },
          ]}
        />
      </ExecutivePanel>

      <ExecutivePanel title="Bed Management" icon={BedDouble} dense>
        <div className="flex items-end justify-between gap-2">
          <MetricValue
            value={
              <>
                {beds.occupied}
                <span className="text-sm font-semibold text-slate-400">/{beds.total}</span>
              </>
            }
            label="Occupied vs Total Beds"
          />
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums text-[#2563EB]">{bedPct}%</p>
            <p className="text-[9px] font-medium text-slate-500">Overall</p>
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#0F172A]" style={{ width: `${bedPct}%` }} />
        </div>
        <SplitMetricRow
          items={[
            { label: 'Available', value: beds.available },
            { label: 'ICU %', value: `${beds.icuOccupancyPercent}%`, highlight: true },
            { label: 'ICU', value: `${beds.icuOccupied}/${beds.icuTotal}` },
          ]}
        />
        <ul className="mt-2 space-y-1">
          {beds.wards.slice(0, 2).map((w) => (
            <li key={w.name} className="flex items-center justify-between text-[9px]">
              <span className="truncate text-slate-600">{w.name}</span>
              <span
                className={`font-bold tabular-nums ${
                  w.status === 'critical' ? 'text-red-600' : w.status === 'high' ? 'text-amber-600' : 'text-slate-700'
                }`}
              >
                {w.occupied}/{w.total}
              </span>
            </li>
          ))}
        </ul>
      </ExecutivePanel>

      <ExecutivePanel title="Live Staffing" icon={Users} dense>
        <MetricValue value={staffing.onDuty} label="Staff on Duty" accent />
        <SplitMetricRow
          items={[
            { label: 'Doctors', value: staffing.doctorsAvailable, highlight: true },
            { label: 'Nurses', value: staffing.nursesOnShift },
            { label: 'Alerts', value: staffing.shortageAlerts.length },
          ]}
        />
        {staffing.shortageAlerts.length > 0 && (
          <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
            {staffing.shortageAlerts.map((a) => (
              <li
                key={a.department}
                className="rounded border border-amber-200/80 bg-amber-50/80 px-2 py-1 text-[9px] text-amber-900"
              >
                <span className="font-bold">{a.department}</span> — {a.gap} short · {a.shift}
              </li>
            ))}
          </ul>
        )}
      </ExecutivePanel>

      <ExecutivePanel title="Financial Pulse" icon={IndianRupee} dense>
        <MetricValue value={formatInr(financial.totalRevenue)} label="Today's Total Revenue" accent />
        <SplitMetricRow
          items={[
            { label: 'OPD', value: formatCompact(financial.opdCollections) },
            { label: 'IPD', value: formatCompact(financial.ipdCollections) },
            { label: 'Pharmacy', value: formatCompact(financial.pharmacyCollections), highlight: true },
          ]}
        />
      </ExecutivePanel>
    </div>
  );
}
