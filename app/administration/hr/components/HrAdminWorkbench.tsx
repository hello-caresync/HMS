'use client';

import { Users } from 'lucide-react';

import { HR_STATUS_STYLES, SEED_HR_ROSTER } from '../../../lib/administration';

export default function HrAdminWorkbench() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-700" />
            <div>
              <h1 className="text-lg font-black text-slate-900">HR Workforce Administration</h1>
              <p className="text-xs text-slate-800">
                Phase 7 · Module 20 · Employee roster &amp; shift assignments
              </p>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 font-bold text-emerald-800">
              {SEED_HR_ROSTER.filter((e) => e.status === 'Active').length} active
            </span>
            <span className="rounded border border-amber-300 bg-amber-50 px-2 py-1 font-bold text-amber-800">
              {SEED_HR_ROSTER.filter((e) => e.status === 'On Leave').length} on leave
            </span>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-800 text-white">
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Employee ID</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Name</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Department</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Role</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Shift</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {SEED_HR_ROSTER.map((emp, index) => (
              <tr
                key={emp.employeeId}
                className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="px-3 py-2 font-mono text-xs font-black">{emp.employeeId}</td>
                <td className="px-3 py-2 text-xs font-bold text-slate-900">{emp.displayName}</td>
                <td className="px-3 py-2 text-xs text-slate-950">{emp.department}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-slate-950">{emp.role}</td>
                <td className="px-3 py-2 text-[10px] text-slate-950">{emp.shiftLabel}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ${HR_STATUS_STYLES[emp.status]}`}
                  >
                    {emp.status}
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
