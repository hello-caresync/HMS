'use client';

import { AUDIT_STATUS_STYLES, type SecurityAuditLogEntry } from '../../../lib/administration';

type SecurityAuditLogTableProps = {
  entries: SecurityAuditLogEntry[];
};

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(iso));
}

export default function SecurityAuditLogTable({ entries }: SecurityAuditLogTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-800 px-4 py-2.5 text-white">
        <h2 className="text-sm font-black">Security Audit Log</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                Timestamp
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                Employee ID
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                Performed Action
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                IP Address
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr
                key={entry.id}
                className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="px-3 py-2 font-mono text-[10px] text-slate-900">
                  {formatTimestamp(entry.timestamp)}
                </td>
                <td className="px-3 py-2 font-mono text-xs font-bold text-slate-900">
                  {entry.employeeId}
                </td>
                <td className="px-3 py-2 text-xs text-slate-950">{entry.performedAction}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-slate-950">{entry.ipAddress}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded px-2 py-0.5 font-mono text-[9px] font-black uppercase ring-1 ${AUDIT_STATUS_STYLES[entry.statusTag]}`}
                  >
                    {entry.statusTag}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
