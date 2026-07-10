'use client';

import { useSettings } from '../context/SettingsProvider';

export default function DepartmentsPanel() {
  const { departments } = useSettings();

  return (
    <div className="rounded border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 px-3 py-2">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">
          Organization
        </p>
        <p className="text-[11px] font-bold text-slate-900">Department Registry</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100 text-left">
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">Code</th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Department
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Department Head
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d, i) => (
              <tr
                key={d.id}
                className={`border-b-2 border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="px-3 py-2 font-mono font-bold text-slate-900">{d.code}</td>
                <td className="px-3 py-2 font-bold text-slate-950">{d.name}</td>
                <td className="px-3 py-2 text-slate-950">{d.head}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      d.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {d.active ? 'Active' : 'Inactive'}
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
