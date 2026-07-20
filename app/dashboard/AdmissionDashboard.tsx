'use client';

import {
  Activity,
  AlertTriangle,
  BedDouble,
  ClipboardList,
  TrendingUp,
  Users,
} from 'lucide-react';

import { MasterDataTable, MasterPanel, MasterViewHeader } from './_masterLightUi';

const KPI_CARDS = [
  { label: "Today's Admissions", value: '24', delta: '+12% vs yesterday', icon: ClipboardList, tone: 'text-blue-600' },
  { label: 'Pending Requests', value: '7', delta: '3 emergency', icon: AlertTriangle, tone: 'text-amber-600' },
  { label: 'Inpatient Census', value: '186', delta: '84% capacity', icon: Users, tone: 'text-slate-800' },
  { label: 'Beds Available', value: '42', delta: '16 ICU · 26 General', icon: BedDouble, tone: 'text-emerald-600' },
  { label: 'Emergency Flags', value: '3', delta: 'Red-zone active', icon: AlertTriangle, tone: 'text-rose-600' },
  { label: '7-Day Trend', value: '+8.4%', delta: 'Admissions up', icon: TrendingUp, tone: 'text-blue-600' },
];

const TREND_DATA = [
  { day: 'Mon', admissions: 18, discharges: 14 },
  { day: 'Tue', admissions: 22, discharges: 16 },
  { day: 'Wed', admissions: 19, discharges: 18 },
  { day: 'Thu', admissions: 24, discharges: 15 },
  { day: 'Fri', admissions: 21, discharges: 17 },
  { day: 'Sat', admissions: 16, discharges: 12 },
  { day: 'Sun', admissions: 14, discharges: 11 },
];

export default function AdmissionDashboard() {
  const maxVal = Math.max(...TREND_DATA.flatMap((d) => [d.admissions, d.discharges]));

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Admission Command Dashboard"
        subtitle="Master analytical panel for intake volume, census, bed indices, and trend forecasting."
        icon={Activity}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {kpi.label}
                  </p>
                  <p className={`mt-1 text-2xl font-bold tabular-nums ${kpi.tone}`}>{kpi.value}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{kpi.delta}</p>
                </div>
                <span className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
                  <Icon className={`h-4 w-4 ${kpi.tone}`} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <MasterPanel title="Historical Admission Trends" description="7-day intake vs discharge volume">
        <div className="flex h-40 items-end justify-between gap-2 border-b border-slate-200 pb-2">
          {TREND_DATA.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 120 }}>
                <div
                  className="w-3 rounded-t bg-blue-500"
                  style={{ height: `${(d.admissions / maxVal) * 100}%` }}
                  title={`Admissions: ${d.admissions}`}
                />
                <div
                  className="w-3 rounded-t bg-slate-300"
                  style={{ height: `${(d.discharges / maxVal) * 100}%` }}
                  title={`Discharges: ${d.discharges}`}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-500">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-[10px] font-semibold text-slate-600">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-blue-500" /> Admissions
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-slate-300" /> Discharges
          </span>
        </div>
      </MasterPanel>

      <MasterPanel title="Active Emergency Flags" description="High-priority admission triggers">
        <MasterDataTable
          columns={['Patient', 'Source', 'Priority', 'ETA']}
          rows={[
            ['Unknown MVA', 'ER Trauma', 'Red', 'On-site'],
            ['Sanjay Rao', 'ER Bay T-4', 'Orange', '12 min'],
            ['Lakshmi N.', 'Direct Admit', 'Yellow', 'Scheduled'],
          ]}
        />
      </MasterPanel>
    </div>
  );
}
