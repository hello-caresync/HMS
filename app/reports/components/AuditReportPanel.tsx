'use client';

import { ShieldAlert } from 'lucide-react';

import { useReports } from '../context/ReportsProvider';
import { formatCurrency, formatTimestamp } from '../types';

const ROLE_STYLES: Record<string, string> = {
  Administrator: 'bg-violet-100 text-violet-800 ring-violet-200',
  Pharmacist: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  'Lab Technician': 'bg-sky-100 text-sky-800 ring-sky-200',
  'Store Manager': 'bg-amber-100 text-amber-800 ring-amber-200',
  'HR Manager': 'bg-teal-100 text-teal-800 ring-teal-200',
};

function impactStyle(value: number): string {
  if (value > 0) return 'text-emerald-700 font-bold';
  if (value < 0) return 'text-rose-700 font-bold';
  return 'text-slate-800';
}

export default function AuditReportPanel() {
  const { auditLogs } = useReports();

  return (
    <div className="rounded border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b-2 border-slate-200 px-3 py-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">
              System Audit Trail
            </p>
            <p className="text-[11px] font-bold text-slate-900">Compliance & Override Log</p>
          </div>
        </div>
        <span className="rounded bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-700 ring-1 ring-rose-200">
          {auditLogs.filter((l) => l.impactValue !== 0).length} high-impact
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100 text-left">
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Timestamp
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                User ID
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                User Role
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Component Checked
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Action Undertaken
              </th>
              <th className="px-3 py-2 text-right font-black uppercase tracking-wider text-slate-950">
                Impact Value
              </th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((entry, i) => {
              const roleStyle = ROLE_STYLES[entry.userRole] ?? 'bg-slate-100 text-slate-900 ring-slate-200';
              const highImpact = entry.impactValue !== 0;
              return (
                <tr
                  key={entry.id}
                  className={`border-b-2 border-slate-200 ${
                    highImpact ? 'bg-rose-50/40' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-slate-950">
                    {formatTimestamp(entry.timestamp)}
                  </td>
                  <td className="px-3 py-2 font-mono font-bold text-slate-950">{entry.userId}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ring-1 ${roleStyle}`}
                    >
                      {entry.userRole}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-bold text-slate-900">{entry.componentChecked}</td>
                  <td className="px-3 py-2 font-bold text-slate-950">{entry.actionUndertaken}</td>
                  <td
                    className={`px-3 py-2 text-right font-mono tabular-nums ${impactStyle(entry.impactValue)}`}
                  >
                    {entry.impactValue === 0
                      ? '—'
                      : entry.impactValue > 0
                        ? `+${formatCurrency(entry.impactValue)}`
                        : `−${formatCurrency(Math.abs(entry.impactValue))}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
