'use client';

import { Pill, Plus, Search } from 'lucide-react';

import { usePharmacyCatalog } from '../context/PharmacyCatalogProvider';
import AddPharmacyEntryDrawer from './AddPharmacyEntryDrawer';

function ActiveToggle({
  active,
  onToggle,
  label,
}: {
  active: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        active ? 'bg-emerald-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          active ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function PharmacyCatalogGrid() {
  const {
    entries,
    filteredEntries,
    searchQuery,
    setSearchQuery,
    openDrawer,
    toggleEntryActive,
  } = usePharmacyCatalog();

  const activeCount = entries.filter((e) => e.isActive).length;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Catalog SKUs
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">{entries.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Active Items
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-emerald-800">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Filtered View
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">
            {filteredEntries.length}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm">
        <div className="relative min-w-[240px] flex-1 max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-800" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drug, generic, manufacturer, HSN…"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <button
          type="button"
          onClick={openDrawer}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-900"
        >
          <Plus className="h-4 w-4" />
          Add New Master Entry
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-800 text-white">
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">
                  Drug Name
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">
                  Generic Formula
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">
                  Manufacturer
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">
                  HSN Code
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">
                  Packaging Unit
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider">
                  Active
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={`border-b-2 border-slate-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Pill className="h-3.5 w-3.5 text-sky-600" />
                      <span className="font-semibold text-slate-900">{entry.drugName}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-800">{entry.id}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-900">{entry.genericFormula}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-900">
                    {entry.manufacturer}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-slate-800">{entry.hsnCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-900">
                      {entry.packagingUnit}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <ActiveToggle
                        active={entry.isActive}
                        onToggle={() => toggleEntryActive(entry.id)}
                        label={`Toggle ${entry.drugName}`}
                      />
                      <span className="w-8 text-[10px] font-bold uppercase text-slate-800">
                        {entry.isActive ? 'On' : 'Off'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-slate-800">
            No pharmacy master entries match your search.
          </div>
        )}
      </div>

      <AddPharmacyEntryDrawer />
    </div>
  );
}
