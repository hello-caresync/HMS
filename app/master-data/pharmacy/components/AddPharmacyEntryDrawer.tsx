'use client';

import { useState } from 'react';
import { Pill, Plus, X } from 'lucide-react';

import { PACKAGING_UNITS } from '../../../lib/foundation';
import type { CreatePharmacyEntryDraft } from '../../../lib/foundation/types';
import { usePharmacyCatalog } from '../context/PharmacyCatalogProvider';

const EMPTY_DRAFT: CreatePharmacyEntryDraft = {
  drugName: '',
  genericFormula: '',
  manufacturer: '',
  hsnCode: '',
  packagingUnit: 'Strips',
  isActive: true,
};

export default function AddPharmacyEntryDrawer() {
  const { drawerOpen, closeDrawer, addEntry } = usePharmacyCatalog();
  const [draft, setDraft] = useState<CreatePharmacyEntryDraft>(EMPTY_DRAFT);

  if (!drawerOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    addEntry(draft);
    setDraft(EMPTY_DRAFT);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40" onClick={closeDrawer} aria-hidden />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-300 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b-2 border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-white">
              <Pill className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Add New Master Entry</p>
              <p className="text-[11px] text-slate-800">Pharmacy inventory catalog</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-lg p-2 text-slate-800 hover:bg-slate-100"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-4 p-5">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Drug Name (Brand)
              </span>
              <input
                required
                value={draft.drugName}
                onChange={(e) => setDraft((d) => ({ ...d, drugName: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                placeholder="Dolo 650"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Generic Formula
              </span>
              <input
                required
                value={draft.genericFormula}
                onChange={(e) => setDraft((d) => ({ ...d, genericFormula: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                placeholder="Paracetamol 650 mg"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Manufacturer
              </span>
              <input
                required
                value={draft.manufacturer}
                onChange={(e) => setDraft((d) => ({ ...d, manufacturer: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                placeholder="Micro Labs Ltd."
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                HSN Code
              </span>
              <input
                required
                value={draft.hsnCode}
                onChange={(e) => setDraft((d) => ({ ...d, hsnCode: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                placeholder="30049061"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Packaging Unit Category
              </span>
              <select
                value={draft.packagingUnit}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    packagingUnit: e.target.value as CreatePharmacyEntryDraft['packagingUnit'],
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              >
                {PACKAGING_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-xs font-semibold text-slate-900">Active in pharmacy catalog</span>
            </label>
          </div>

          <footer className="mt-auto border-t border-slate-200 bg-slate-50 px-5 py-4">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-3 text-sm font-bold text-white hover:bg-slate-900"
            >
              <Plus className="h-4 w-4" />
              Save Master Entry
            </button>
          </footer>
        </form>
      </aside>
    </>
  );
}
