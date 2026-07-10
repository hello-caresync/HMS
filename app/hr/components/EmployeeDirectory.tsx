'use client';

import { useHr } from '../context/HrProvider';
import { STATUS_STYLES } from '../types';

export default function EmployeeDirectory() {
  const { employees } = useHr();

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
          Employee Directory
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-[#0a0e14] text-[10px] uppercase tracking-wider text-slate-800">
              <th className="px-3 py-2 text-left font-black">Employee</th>
              <th className="px-3 py-2 text-left font-black">Staff ID</th>
              <th className="px-3 py-2 text-left font-black">Role</th>
              <th className="px-3 py-2 text-left font-black">Department</th>
              <th className="px-3 py-2 text-left font-black">Active Shift</th>
              <th className="px-3 py-2 text-left font-black">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-100/60">
                <td className="px-3 py-2 font-bold text-slate-900">{emp.name}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-slate-950">{emp.staffId}</td>
                <td className="px-3 py-2 text-slate-900">{emp.role}</td>
                <td className="px-3 py-2 text-slate-950">{emp.department}</td>
                <td className="max-w-[180px] truncate px-3 py-2 text-slate-950" title={emp.activeShift}>
                  {emp.activeShift}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${STATUS_STYLES[emp.status]}`}
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
