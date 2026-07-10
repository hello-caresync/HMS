'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { useSettings } from '../context/SettingsProvider';
import { formatCurrency } from '../types';

export default function ServicesPackagesPanel() {
  const { services, taxes, departmentOptions, addService, deleteService } = useSettings();
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(departmentOptions[0] ?? '');
  const [baseFee, setBaseFee] = useState('');
  const [taxStructureId, setTaxStructureId] = useState(taxes[0]?.id ?? '');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function taxLabel(taxId: string) {
    return taxes.find((t) => t.id === taxId)?.name ?? '—';
  }

  function handleAdd() {
    const fee = parseFloat(baseFee);
    if (!name.trim() || Number.isNaN(fee) || !taxStructureId) return;
    addService({ name: name.trim(), department, baseFee: fee, taxStructureId });
    setName('');
    setBaseFee('');
  }

  return (
    <div className="space-y-3">
      <div className="rounded border border-slate-200 bg-white shadow-sm">
        <div className="border-b-2 border-slate-200 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">
            Service Catalog
          </p>
          <p className="text-[11px] font-bold text-slate-900">
            Services & Packages · Fee & Tax Configuration
          </p>
        </div>

        <div className="grid gap-2 border-b-2 border-slate-200 bg-slate-50 px-3 py-2.5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="text-[9px] font-bold uppercase text-slate-800">Service Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Procedure / consultation"
              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px]"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase text-slate-800">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px]"
            >
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase text-slate-800">Base Fee (₹)</label>
            <input
              type="number"
              min={0}
              value={baseFee}
              onChange={(e) => setBaseFee(e.target.value)}
              placeholder="0"
              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-mono"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase text-slate-800">Tax Rate</label>
            <select
              value={taxStructureId}
              onChange={(e) => setTaxStructureId(e.target.value)}
              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px]"
            >
              {taxes.filter((t) => t.active).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!name.trim() || !baseFee}
              className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-slate-800 py-1.5 text-[10px] font-bold text-white disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Service
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[11px]">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-100 text-left">
                <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                  Service Name
                </th>
                <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                  Department
                </th>
                <th className="px-3 py-2 text-right font-black uppercase tracking-wider text-slate-950">
                  Base Fee
                </th>
                <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                  Tax Rate
                </th>
                <th className="px-3 py-2 text-right font-black uppercase tracking-wider text-slate-950">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc, i) => (
                <tr
                  key={svc.id}
                  className={`border-b-2 border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  <td className="px-3 py-2 font-bold text-slate-950">{svc.name}</td>
                  <td className="px-3 py-2 text-slate-950">{svc.department}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-slate-950">
                    {formatCurrency(svc.baseFee)}
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-900">
                      {taxLabel(svc.taxStructureId)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {confirmDeleteId === svc.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          deleteService(svc.id);
                          setConfirmDeleteId(null);
                        }}
                        className="rounded bg-rose-600 px-2 py-1 text-[9px] font-bold text-white"
                      >
                        Confirm Delete
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(svc.id)}
                        className="rounded p-1 text-rose-500 hover:bg-rose-50"
                        aria-label="Delete service"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
