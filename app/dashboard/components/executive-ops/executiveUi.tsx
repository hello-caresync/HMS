'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function ExecutivePanel({
  title,
  subtitle,
  icon: Icon,
  headerRight,
  children,
  className = '',
  dense = false,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200/90 bg-white shadow-sm ${dense ? 'p-4' : 'p-5'} ${className}`}
    >
      <header className={`mb-3 flex items-start justify-between gap-3 ${dense ? 'mb-3' : ''}`}>
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#0F172A] text-white">
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-1 text-sm leading-snug text-slate-600">{subtitle}</p>}
          </div>
        </div>
        {headerRight}
      </header>
      {children}
    </section>
  );
}

export function MetricValue({
  value,
  label,
  sub,
  accent = false,
}: {
  value: ReactNode;
  label: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-2xl font-bold tabular-nums leading-none tracking-tight ${accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}
      >
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{label}</p>
      {sub && <p className="mt-1 text-sm text-slate-600">{sub}</p>}
    </div>
  );
}

export function SplitMetricRow({
  items,
}: {
  items: { label: string; value: string | number; highlight?: boolean }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
      {items.map((item) => (
        <div key={item.label}>
          <p
            className={`text-base font-bold tabular-nums ${item.highlight ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}
          >
            {item.value}
          </p>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-600">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[280px] text-left">
        <thead>
          <tr className="border-b border-slate-200">
            {headers.map((h) => (
              <th
                key={h}
                className="pb-2 pr-3 text-sm font-bold uppercase tracking-wider text-slate-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-3 pr-3 text-base font-medium text-slate-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SeverityPill({ severity }: { severity: 'critical' | 'warning' | 'info' }) {
  const styles = {
    critical: 'border-red-300/60 bg-red-50 text-red-700 shadow-[0_0_12px_rgba(220,38,38,0.25)]',
    warning: 'border-amber-300/60 bg-amber-50 text-amber-800 shadow-[0_0_10px_rgba(217,119,6,0.2)]',
    info: 'border-slate-200 bg-slate-50 text-slate-600',
  } as const;

  return (
    <span
      className={`inline-flex shrink-0 rounded-md border px-3 py-1 text-sm font-semibold uppercase tracking-wider ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}

export const CHART_COLORS = {
  navy: '#0F172A',
  navyMid: '#1E293B',
  navyLight: '#334155',
  cobalt: '#2563EB',
  cobaltMuted: '#93C5FD',
} as const;
