'use client';

import { useSettings } from '../context/SettingsProvider';

function formatTs(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export default function ConfigAuditLogsPanel() {
  const { configAudit } = useSettings();

  return (
    <div className="rounded border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 px-3 py-2">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">Security</p>
        <p className="text-[11px] font-bold text-slate-900">Configuration Audit Trail</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100 text-left">
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Timestamp
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                User ID
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Panel
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {configAudit.map((entry, i) => (
              <tr
                key={entry.id}
                className={`border-b-2 border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-slate-950">
                  {formatTs(entry.timestamp)}
                </td>
                <td className="px-3 py-2 font-mono font-bold text-slate-950">{entry.userId}</td>
                <td className="px-3 py-2 text-slate-900">{entry.panel}</td>
                <td className="px-3 py-2 font-bold text-slate-950">{entry.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
