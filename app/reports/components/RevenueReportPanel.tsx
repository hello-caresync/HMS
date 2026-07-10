'use client';

import { BarChart3 } from 'lucide-react';

import { useReports } from '../context/ReportsProvider';
import { formatCurrency } from '../types';

export default function RevenueReportPanel() {
  const { revenueRows, revenueTrend } = useReports();

  const maxProfit = Math.max(...revenueTrend.map((p) => p.netProfit));

  const totals = revenueRows.reduce(
    (acc, row) => ({
      gross: acc.gross + row.grossRevenue,
      gst: acc.gst + row.gstCollected,
      deductions: acc.deductions + row.deductions,
      net: acc.net + row.netProfit,
    }),
    { gross: 0, gst: 0, deductions: 0, net: 0 },
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b-2 border-slate-200 px-3 py-2">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">
                Revenue Ledger
              </p>
              <p className="text-[11px] font-bold text-slate-900">Department Gross-to-Net Breakdown</p>
            </div>
            <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[9px] font-bold text-indigo-700">
              MTD · Jul 2026 W1
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[11px]">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100 text-left">
                  <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                    Period
                  </th>
                  <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                    Department
                  </th>
                  <th className="px-3 py-2 text-right font-black uppercase tracking-wider text-slate-950">
                    Gross Revenue
                  </th>
                  <th className="px-3 py-2 text-right font-black uppercase tracking-wider text-slate-950">
                    GST Collected
                  </th>
                  <th className="px-3 py-2 text-right font-black uppercase tracking-wider text-slate-950">
                    Deductions
                  </th>
                  <th className="px-3 py-2 text-right font-black uppercase tracking-wider text-slate-950">
                    Net Profit
                  </th>
                </tr>
              </thead>
              <tbody>
                {revenueRows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b-2 border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                  >
                    <td className="px-3 py-2 font-mono text-slate-950">{row.period}</td>
                    <td className="px-3 py-2 font-bold text-slate-950">{row.department}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900">
                      {formatCurrency(row.grossRevenue)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-950">
                      {formatCurrency(row.gstCollected)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-rose-600">
                      −{formatCurrency(row.deductions)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-emerald-700">
                      {formatCurrency(row.netProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                  <td className="px-3 py-2 text-slate-950" colSpan={2}>
                    Totals
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-950">
                    {formatCurrency(totals.gross)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900">
                    {formatCurrency(totals.gst)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-rose-700">
                    −{formatCurrency(totals.deductions)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-emerald-800">
                    {formatCurrency(totals.net)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b-2 border-slate-200 px-3 py-2">
            <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">
                Trend Analysis
              </p>
              <p className="text-[11px] font-bold text-slate-900">Net Profit Trajectory</p>
            </div>
          </div>
          <div className="p-3">
            <div className="flex h-36 items-end justify-between gap-1.5 border-b border-l border-slate-200 pb-1 pl-1">
              {revenueTrend.map((point) => {
                const heightPct = Math.round((point.netProfit / maxProfit) * 100);
                return (
                  <div key={point.month} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-indigo-500 transition-all"
                      style={{ height: `${heightPct}%`, minHeight: '4px' }}
                      title={formatCurrency(point.netProfit)}
                    />
                    <span className="text-[9px] font-bold text-slate-800">{point.month}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-slate-800">
              Visualization placeholder · 6-month net profit trend. Connect live BI pipeline for
              interactive drill-down.
            </p>
            <div className="mt-2 rounded border border-dashed border-indigo-200 bg-indigo-50/50 px-2 py-1.5">
              <p className="text-[10px] font-bold text-indigo-700">+14.5% MoM Growth</p>
              <p className="text-[9px] text-indigo-600">Peak: Jul 2026 · ₹1.16 Cr net</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
