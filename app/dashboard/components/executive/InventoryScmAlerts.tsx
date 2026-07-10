'use client';

import { AlertTriangle, Info, Package, TriangleAlert } from 'lucide-react';

import type { ScmAlert } from '../../types';

type InventoryScmAlertsProps = {
  alerts: ScmAlert[];
};

const SEVERITY_STYLES = {
  critical: {
    icon: TriangleAlert,
    border: 'border-red-200',
    bg: 'bg-red-50/80',
    iconColor: 'text-red-600',
    badge: 'bg-red-600 text-white',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-200',
    bg: 'bg-amber-50/80',
    iconColor: 'text-amber-600',
    badge: 'bg-amber-500 text-white',
    label: 'Warning',
  },
  info: {
    icon: Info,
    border: 'border-slate-200',
    bg: 'bg-slate-50/80',
    iconColor: 'text-slate-800',
    badge: 'bg-slate-500 text-white',
    label: 'Info',
  },
} as const;

export default function InventoryScmAlerts({ alerts }: InventoryScmAlertsProps) {
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <article className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 p-5 shadow-xs">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 ring-1 ring-amber-200">
            <Package className="h-4 w-4 text-amber-700" strokeWidth={2} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Inventory & SCM Alerts</h3>
            <p className="text-[11px] text-slate-800">Critical supply chain notices</p>
          </div>
        </div>
        {criticalCount > 0 && (
          <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            {criticalCount} critical
          </span>
        )}
      </header>

      <ul className="space-y-2.5">
        {alerts.map((alert) => {
          const style = SEVERITY_STYLES[alert.severity];
          const Icon = style.icon;
          return (
            <li
              key={alert.id}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${style.border} ${style.bg}`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconColor}`} strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex flex-wrap items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${style.badge}`}>
                    {style.label}
                  </span>
                  <span className="text-[10px] font-medium text-slate-800">{alert.module}</span>
                </div>
                <p className="text-sm font-medium leading-snug text-slate-800">{alert.message}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
