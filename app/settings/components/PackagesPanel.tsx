'use client';

import { useSettings } from '../context/SettingsProvider';
import { formatCurrency } from '../types';

export default function PackagesPanel() {
  const { packages, services } = useSettings();

  function serviceNames(ids: string[]) {
    return ids
      .map((id) => services.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '—';
  }

  return (
    <div className="rounded border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 px-3 py-2">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">Financials</p>
        <p className="text-[11px] font-bold text-slate-900">Care Packages</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100 text-left">
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Package Name
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Included Services
              </th>
              <th className="px-3 py-2 text-right font-black uppercase tracking-wider text-slate-950">
                Bundle Price
              </th>
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg, i) => (
              <tr
                key={pkg.id}
                className={`border-b-2 border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="px-3 py-2 font-bold text-slate-950">{pkg.name}</td>
                <td className="px-3 py-2 text-slate-950">{serviceNames(pkg.serviceIds)}</td>
                <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-slate-950">
                  {formatCurrency(pkg.bundlePrice)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      pkg.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {pkg.active ? 'Active' : 'Inactive'}
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
