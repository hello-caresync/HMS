'use client';

import { ClipboardList } from 'lucide-react';

import { useReports } from '../context/ReportsProvider';
import { DIMENSION_LABELS } from '../types';

const STATUS_STYLES: Record<string, string> = {
  Normal: 'bg-slate-100 text-slate-900',
  Alert: 'bg-rose-100 text-rose-800',
  Warning: 'bg-amber-100 text-amber-800',
  Elevated: 'bg-orange-100 text-orange-800',
  Review: 'bg-violet-100 text-violet-800',
  Active: 'bg-sky-100 text-sky-800',
};

export default function GenericReportPanel() {
  const { activeDimension, genericRows } = useReports();

  return (
    <div className="space-y-3">
      <div className="rounded border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b-2 border-slate-200 px-3 py-2">
          <ClipboardList className="h-3.5 w-3.5 text-indigo-500" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">
              Operational Summary
            </p>
            <p className="text-[11px] font-bold text-slate-900">
              {DIMENSION_LABELS[activeDimension]} · Detail Ledger
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[11px]">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-100 text-left">
                <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                  Report Item
                </th>
                <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                  Category / Entity
                </th>
                <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                  Value
                </th>
                <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                  Status
                </th>
                <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                  Period
                </th>
              </tr>
            </thead>
            <tbody>
              {genericRows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b-2 border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  <td className="px-3 py-2 font-bold text-slate-950">{row.label}</td>
                  <td className="px-3 py-2 text-slate-950">{row.metric}</td>
                  <td className="px-3 py-2 font-mono font-bold tabular-nums text-slate-950">
                    {row.value}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${STATUS_STYLES[row.status] ?? 'bg-slate-100 text-slate-900'}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-950">{row.period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <SummaryCard
          title="Data Freshness"
          value="Live · 30s sync"
          detail="Last ETL pipeline run: 09 Jul 2026 16:28 IST"
        />
        <SummaryCard
          title="Record Coverage"
          value={`${genericRows.length} active rows`}
          detail="Full dataset available via CSV/PDF export"
        />
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">{title}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-800">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-800">{detail}</p>
    </div>
  );
}
