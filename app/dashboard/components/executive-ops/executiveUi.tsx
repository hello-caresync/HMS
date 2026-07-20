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
      className={`rounded-lg border border-slate-200/90 bg-white shadow-sm ${dense ? 'p-3' : 'p-3.5'} ${className}`}
    >
      <header className={`mb-2.5 flex items-start justify-between gap-2 ${dense ? 'mb-2' : ''}`}>
        <div className="flex min-w-0 items-start gap-2">
          {Icon && (
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0F172A] text-white">
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-[#0F172A]">
              {title}
            </h3>
            {subtitle && <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{subtitle}</p>}
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
        className={`text-xl font-bold tabular-nums leading-none tracking-tight ${accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold text-slate-600">{label}</p>
      {sub && <p className="mt-0.5 text-[9px] text-slate-400">{sub}</p>}
    </div>
  );
}

export function SplitMetricRow({
  items,
}: {
  items: { label: string; value: string | number; highlight?: boolean }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2">
      {items.map((item) => (
        <div key={item.label}>
          <p
            className={`text-sm font-bold tabular-nums ${item.highlight ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}
          >
            {item.value}
          </p>
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
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
          <tr className="border-b border-slate-100">
            {headers.map((h) => (
              <th
                key={h}
                className="pb-1.5 pr-2 text-[9px] font-bold uppercase tracking-wider text-slate-400"
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
                <td key={j} className="py-1.5 pr-2 text-[10px] font-medium text-slate-700">
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
      className={`inline-flex shrink-0 rounded-full border px-1.5 py-px text-[8px] font-bold uppercase tracking-wider ${styles[severity]}`}
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
