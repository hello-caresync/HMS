'use client';

import { useSettings } from '../context/SettingsProvider';

export default function InsurancePanel() {
  const { insurance } = useSettings();

  return (
    <div className="rounded border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 px-3 py-2">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">Financials</p>
        <p className="text-[11px] font-bold text-slate-900">Insurance & TPA Providers</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100 text-left">
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Provider
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                TPA Code
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {insurance.map((ins, i) => (
              <tr
                key={ins.id}
                className={`border-b-2 border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="px-3 py-2 font-bold text-slate-950">{ins.name}</td>
                <td className="px-3 py-2 font-mono text-slate-950">{ins.tpaCode}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      ins.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {ins.active ? 'Active' : 'Inactive'}
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
