'use client';

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  CircleAlert,
  DoorOpen,
  IndianRupee,
  PackageMinus,
  Receipt,
  Siren,
  Stethoscope,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

import { DASHBOARD_METRICS, formatCurrency } from '../lib/mockData';
import type { DashboardMetrics } from '../types';
import WidgetCard from './WidgetCard';

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 120;
  const height = 36;
  const step = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-full max-w-[140px]" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
        points={points}
      />
    </svg>
  );
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous;
  const pct = previous === 0 ? 100 : Math.round((delta / previous) * 100);
  const up = delta >= 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
      }`}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(pct)}%
    </span>
  );
}

type DashboardWidgetsProps = {
  metrics?: DashboardMetrics;
};

export default function DashboardWidgets({ metrics = DASHBOARD_METRICS }: DashboardWidgetsProps) {
  const {
    todaysPatients,
    appointments,
    revenue,
    pendingBills,
    pendingPayments,
    lowStock,
    criticalPatients,
    admissions,
    discharges,
    emergencyCases,
  } = metrics;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {/* Today's Patients */}
      <WidgetCard title="Today's Patients" icon={Users} iconClassName="text-sky-600">
        <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">
          {todaysPatients.count}
        </p>
        <p className="mt-0.5 text-xs text-slate-800">Active encounters today</p>
        <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3">
          {todaysPatients.upcoming.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-slate-900">{p.name}</span>
              <span className="shrink-0 font-mono text-slate-800">{p.time}</span>
            </li>
          ))}
        </ul>
      </WidgetCard>

      {/* Appointments */}
      <WidgetCard
        title="Appointments"
        icon={CalendarDays}
        iconClassName="text-violet-600"
        headerExtra={<TrendBadge current={appointments.today} previous={appointments.yesterday} />}
      >
        <p className="text-3xl font-bold tabular-nums text-slate-900">{appointments.today}</p>
        <p className="mt-0.5 text-xs text-slate-800">Scheduled today</p>
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-800">Yesterday</p>
            <p className="text-lg font-semibold text-slate-800">{appointments.yesterday}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+{appointments.today - appointments.yesterday} vs prior day</span>
          </div>
        </div>
      </WidgetCard>

      {/* Revenue */}
      <WidgetCard
        title="Revenue"
        icon={IndianRupee}
        iconClassName="text-primary"
        className="sm:col-span-2 xl:col-span-1"
        headerExtra={
          <span className="rounded-full bg-primary-muted px-2 py-0.5 text-[11px] font-semibold text-primary">
            +{revenue.changePercent}%
          </span>
        }
      >
        <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl">
          {formatCurrency(revenue.amount, revenue.currency)}
        </p>
        <p className="mt-0.5 text-xs text-slate-800">Gross collections · today</p>
        <div className="mt-3 flex items-end justify-between">
          <Sparkline values={revenue.sparkline} />
          <span className="text-[11px] text-slate-800">10-day trend</span>
        </div>
      </WidgetCard>

      {/* Pending Bills */}
      <WidgetCard title="Pending Bills" icon={Receipt} iconClassName="text-amber-600">
        <p className="text-3xl font-bold tabular-nums text-slate-900">{pendingBills.count}</p>
        <p className="mt-0.5 text-xs text-slate-800">Awaiting clearance</p>
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          {formatCurrency(pendingBills.totalValue)} cumulative
        </p>
      </WidgetCard>

      {/* Pending Payments */}
      <WidgetCard title="Pending Payments" icon={Wallet} iconClassName="text-orange-600">
        <p className="text-3xl font-bold tabular-nums text-slate-900">{pendingPayments.count}</p>
        <p className="mt-0.5 text-xs text-slate-800">
          Invoice queue · oldest {pendingPayments.oldestDays}d
        </p>
        <ul className="mt-3 space-y-1.5">
          {pendingPayments.topInvoices.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px]"
            >
              <span className="font-mono text-slate-800">{inv.id}</span>
              <span className="font-semibold text-slate-800">{formatCurrency(inv.amount)}</span>
            </li>
          ))}
        </ul>
      </WidgetCard>

      {/* Low Stock */}
      <WidgetCard
        title="Low Stock"
        icon={PackageMinus}
        iconClassName="text-rose-600"
        className="sm:col-span-2"
        headerExtra={
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
            {lowStock.length} critical
          </span>
        }
      >
        <ul className="space-y-3">
          {lowStock.map((item) => {
            const pct = Math.min(100, Math.round((item.currentUnits / item.safetyThreshold) * 100));
            return (
              <li key={item.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-900">{item.name}</span>
                  <span className="shrink-0 font-mono text-rose-600">
                    {item.currentUnits}/{item.safetyThreshold} {item.unit}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct < 30 ? 'bg-rose-500' : pct < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </WidgetCard>

      {/* Critical Patients */}
      <WidgetCard
        title="Critical Patients"
        icon={Stethoscope}
        iconClassName="text-red-600"
        headerExtra={
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
            {criticalPatients.length}
          </span>
        }
      >
        <ul className="space-y-2">
          {criticalPatients.map((p) => (
            <li
              key={p.id}
              className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50/60 px-3 py-2"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
                <p className="text-[11px] text-slate-800">
                  {p.ward} · {p.vitals}
                </p>
              </div>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                  p.priority === 'critical'
                    ? 'bg-red-600 text-white'
                    : 'bg-orange-500 text-white'
                }`}
              >
                {p.priority}
              </span>
            </li>
          ))}
        </ul>
      </WidgetCard>

      {/* Admissions */}
      <WidgetCard
        title="Admissions"
        icon={BedDouble}
        iconClassName="text-teal-600"
        headerExtra={<TrendBadge current={admissions.today} previous={admissions.yesterday} />}
      >
        <p className="text-3xl font-bold tabular-nums text-slate-900">{admissions.today}</p>
        <p className="mt-0.5 text-xs text-slate-800">Admitted today</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-800">
          <Activity className="h-3.5 w-3.5 text-teal-500" />
          <span>Yesterday: {admissions.yesterday} admissions</span>
        </div>
      </WidgetCard>

      {/* Discharges */}
      <WidgetCard
        title="Discharges"
        icon={DoorOpen}
        iconClassName="text-indigo-600"
        headerExtra={<TrendBadge current={discharges.today} previous={discharges.yesterday} />}
      >
        <p className="text-3xl font-bold tabular-nums text-slate-900">{discharges.today}</p>
        <p className="mt-0.5 text-xs text-slate-800">Discharged today</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-800">
          <Activity className="h-3.5 w-3.5 text-indigo-500" />
          <span>Yesterday: {discharges.yesterday} discharges</span>
        </div>
      </WidgetCard>

      {/* Emergency Cases */}
      <WidgetCard
        title="Emergency Cases"
        icon={Siren}
        iconClassName="text-white"
        tone="inverse"
        className="nexora-emergency-card bg-gradient-to-br from-red-600 to-red-800 sm:col-span-2 xl:col-span-2"
        headerExtra={
          <span className="nexora-emergency-pulse rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Live
          </span>
        }
      >
        <ul className="space-y-3">
          {emergencyCases.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-white">
                  <AlertTriangle className="h-4 w-4" />
                  {c.triage}
                </p>
                <p className="mt-0.5 text-xs text-red-100">{c.patient}</p>
                <p className="text-[11px] text-red-200/80">{c.location}</p>
              </div>
              <span className="mt-1 inline-flex w-fit items-center rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-700 sm:mt-0">
                {c.etaMinutes === 0 ? 'On-site' : `ETA ${c.etaMinutes} min`}
              </span>
            </li>
          ))}
        </ul>
      </WidgetCard>
    </div>
  );
}
