'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';

import { useReports } from '../context/ReportsProvider';

export default function DimensionMetricsGrid() {
  const { summaries } = useReports();

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {summaries.map((s) => (
        <div
          key={s.label}
          className="rounded border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
        >
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">{s.label}</p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <p className="font-mono text-base font-bold tabular-nums text-slate-800">{s.value}</p>
            {s.delta && (
              <span
                className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                  s.trend === 'up'
                    ? 'bg-emerald-50 text-emerald-700'
                    : s.trend === 'down'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-slate-100 text-slate-800'
                }`}
              >
                {s.trend === 'up' && <TrendingUp className="h-2.5 w-2.5" />}
                {s.trend === 'down' && <TrendingDown className="h-2.5 w-2.5" />}
                {s.delta}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
