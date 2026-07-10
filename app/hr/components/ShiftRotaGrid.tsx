'use client';

import { useHr } from '../context/HrProvider';
import { DAY_LABELS, DAYS, SHIFT_STYLES } from '../types';

export default function ShiftRotaGrid() {
  const { employees, rota } = useHr();

  const rotaEmployees = employees.filter((e) => rota.some((r) => r.employeeId === e.id));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
          Weekly Shift Rota Planner
        </p>
        <div className="mt-1 flex flex-wrap gap-2 text-[9px] font-semibold">
          {(['Morning', 'Evening', 'Night', 'Weekly Off'] as const).map((s) => (
            <span key={s} className={`rounded border px-1.5 py-0.5 ${SHIFT_STYLES[s]}`}>
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[10px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-[#0a0e14] text-slate-800">
              <th className="sticky left-0 z-10 bg-[#0a0e14] px-3 py-2 text-left font-black">
                Employee
              </th>
              {DAYS.map((d) => (
                <th key={d} className="min-w-[72px] px-1 py-2 text-center font-black uppercase">
                  {DAY_LABELS[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rotaEmployees.map((emp) => {
              const entry = rota.find((r) => r.employeeId === emp.id);
              if (!entry) return null;
              return (
                <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-100/40">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2">
                    <p className="font-medium text-slate-900">{emp.name}</p>
                    <p className="text-[9px] text-slate-800">{emp.role}</p>
                  </td>
                  {DAYS.map((d) => {
                    const shift = entry.days[d];
                    return (
                      <td key={d} className="px-1 py-1.5 text-center">
                        <span
                          className={`inline-block w-full rounded border px-0.5 py-1 text-[9px] font-bold ${SHIFT_STYLES[shift]}`}
                        >
                          {shift === 'Weekly Off' ? 'Off' : shift.slice(0, 3)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
