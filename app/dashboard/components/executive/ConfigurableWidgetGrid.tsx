'use client';

import {
  Activity,
  AlertTriangle,
  BedDouble,
  CalendarDays,
  CircleAlert,
  DoorOpen,
  PackageMinus,
  Siren,
  Stethoscope,
  Wallet,
} from 'lucide-react';

import { formatCurrency } from '../../lib/mockData';
import type { ConfigurableWidget, DashboardMetrics } from '../../types';
import WidgetCard from '../WidgetCard';

type ConfigurableWidgetGridProps = {
  widgets: ConfigurableWidget[];
  metrics: DashboardMetrics;
};

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
      {up ? '+' : ''}
      {pct}%
    </span>
  );
}

export default function ConfigurableWidgetGrid({ widgets, metrics }: ConfigurableWidgetGridProps) {
  const visible = [...widgets].filter((w) => w.visible).sort((a, b) => a.order - b.order);

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-slate-800">No widgets visible</p>
        <p className="mt-1 text-xs text-slate-800">
          Use Custom Dashboard Widgets to enable operational metric cards
        </p>
      </div>
    );
  }

  const renderWidget = (id: ConfigurableWidget['id']) => {
    switch (id) {
      case 'appointments':
        return (
          <WidgetCard
            key={id}
            title="Appointments"
            icon={CalendarDays}
            iconClassName="text-violet-600"
            headerExtra={
              <TrendBadge
                current={metrics.appointments.today}
                previous={metrics.appointments.yesterday}
              />
            }
          >
            <p className="text-3xl font-bold tabular-nums text-slate-900">
              {metrics.appointments.today}
            </p>
            <p className="mt-0.5 text-xs text-slate-800">Scheduled today</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-800">
              <Activity className="h-3.5 w-3.5 text-violet-500" />
              <span>Yesterday: {metrics.appointments.yesterday}</span>
            </div>
          </WidgetCard>
        );

      case 'critical-patients':
        return (
          <WidgetCard
            key={id}
            title="Critical Patients"
            icon={Stethoscope}
            iconClassName="text-red-600"
            headerExtra={
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                {metrics.criticalPatients.length}
              </span>
            }
          >
            <ul className="space-y-2">
              {metrics.criticalPatients.map((p) => (
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
                </li>
              ))}
            </ul>
          </WidgetCard>
        );

      case 'admissions':
        return (
          <WidgetCard
            key={id}
            title="Admissions"
            icon={BedDouble}
            iconClassName="text-teal-600"
            headerExtra={
              <TrendBadge current={metrics.admissions.today} previous={metrics.admissions.yesterday} />
            }
          >
            <p className="text-3xl font-bold tabular-nums text-slate-900">{metrics.admissions.today}</p>
            <p className="mt-0.5 text-xs text-slate-800">Admitted today</p>
          </WidgetCard>
        );

      case 'discharges':
        return (
          <WidgetCard
            key={id}
            title="Discharges"
            icon={DoorOpen}
            iconClassName="text-indigo-600"
            headerExtra={
              <TrendBadge current={metrics.discharges.today} previous={metrics.discharges.yesterday} />
            }
          >
            <p className="text-3xl font-bold tabular-nums text-slate-900">{metrics.discharges.today}</p>
            <p className="mt-0.5 text-xs text-slate-800">Discharged today</p>
          </WidgetCard>
        );

      case 'low-stock':
        return (
          <WidgetCard
            key={id}
            title="Low Stock"
            icon={PackageMinus}
            iconClassName="text-rose-600"
            className="sm:col-span-2"
            headerExtra={
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                {metrics.lowStock.length} critical
              </span>
            }
          >
            <ul className="space-y-3">
              {metrics.lowStock.slice(0, 3).map((item) => {
                const pct = Math.min(
                  100,
                  Math.round((item.currentUnits / item.safetyThreshold) * 100),
                );
                return (
                  <li key={item.id}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-slate-900">{item.name}</span>
                      <span className="shrink-0 font-mono text-rose-600">
                        {item.currentUnits}/{item.safetyThreshold}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
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
        );

      case 'pending-payments':
        return (
          <WidgetCard key={id} title="Pending Payments" icon={Wallet} iconClassName="text-orange-600">
            <p className="text-3xl font-bold tabular-nums text-slate-900">
              {metrics.pendingPayments.count}
            </p>
            <p className="mt-0.5 text-xs text-slate-800">
              Oldest {metrics.pendingPayments.oldestDays}d
            </p>
            <ul className="mt-3 space-y-1.5">
              {metrics.pendingPayments.topInvoices.slice(0, 2).map((inv) => (
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
        );

      case 'emergency-detail':
        return (
          <WidgetCard
            key={id}
            title="Emergency Detail"
            icon={Siren}
            iconClassName="text-white"
            tone="inverse"
            className="nexora-emergency-card bg-gradient-to-br from-red-600 to-red-800 sm:col-span-2"
            headerExtra={
              <span className="nexora-emergency-pulse rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Live
              </span>
            }
          >
            <ul className="space-y-2">
              {metrics.emergencyCases.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-white">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {c.triage}
                    </p>
                    <p className="text-[11px] text-red-100">{c.patient}</p>
                  </div>
                  <span className="mt-1 inline-flex w-fit rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-red-700 sm:mt-0">
                    {c.etaMinutes === 0 ? 'On-site' : `ETA ${c.etaMinutes}m`}
                  </span>
                </li>
              ))}
            </ul>
          </WidgetCard>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {visible.map((w) => renderWidget(w.id))}
    </div>
  );
}
