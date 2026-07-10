'use client';

import { useState } from 'react';
import { BedDouble, Building2, Layers, Plus } from 'lucide-react';

import { WARD_CATEGORIES } from '../../../lib/foundation';
import type { BedSetupDraft } from '../../../lib/foundation/types';
import { useBedManagement } from '../context/BedManagementProvider';

const EMPTY_DRAFT: BedSetupDraft = {
  branchId: '',
  floorName: '',
  wardCategory: 'General',
  roomIdentifier: '',
  maxBedCount: 4,
};

export default function FacilityBedSetupForm() {
  const { branches, containers, createBedContainer, getBranchName } = useBedManagement();
  const [draft, setDraft] = useState<BedSetupDraft>({
    ...EMPTY_DRAFT,
    branchId: branches[0]?.branchId ?? '',
  });
  const [previewIds, setPreviewIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePreview = () => {
    if (!draft.roomIdentifier.trim() || draft.maxBedCount < 1) return;
    setPreviewIds(
      Array.from({ length: draft.maxBedCount }, (_, i) =>
        `${draft.roomIdentifier.trim().toUpperCase().replace(/\s+/g, '-')}-${String(i + 1).padStart(2, '0')}`,
      ),
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const container = createBedContainer(draft);
    setSuccessMessage(
      `Generated ${container.maxBedCount} beds in ${container.roomIdentifier} (${getBranchName(container.branchId)}).`,
    );
    setPreviewIds(container.generatedBedIds);
    setDraft({ ...EMPTY_DRAFT, branchId: branches[0]?.branchId ?? '' });
    window.setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-300 bg-white shadow-sm"
      >
        <div className="border-b-2 border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Facility Bed Container Setup</h2>
              <p className="text-[11px] text-slate-800">
                Map branch → floor → ward → room → discrete bed inventory
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Branch Select
            </span>
            <select
              required
              value={draft.branchId}
              onChange={(e) => setDraft((d) => ({ ...d, branchId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            >
              {branches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Floor Name
            </span>
            <input
              required
              value={draft.floorName}
              onChange={(e) => setDraft((d) => ({ ...d, floorName: e.target.value }))}
              placeholder="Floor 4 · Critical Care"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Ward Category
            </span>
            <select
              value={draft.wardCategory}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  wardCategory: e.target.value as BedSetupDraft['wardCategory'],
                }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            >
              {WARD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Room Identifier
            </span>
            <input
              required
              value={draft.roomIdentifier}
              onChange={(e) => setDraft((d) => ({ ...d, roomIdentifier: e.target.value }))}
              placeholder="ICU-A / GEN-204"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm uppercase outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Max Bed Count
            </span>
            <input
              required
              type="number"
              min={1}
              max={48}
              value={draft.maxBedCount}
              onChange={(e) =>
                setDraft((d) => ({ ...d, maxBedCount: Number(e.target.value) || 1 }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm tabular-nums outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>

        {successMessage && (
          <div className="mx-5 mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
            {successMessage}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={handlePreview}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100"
          >
            Preview Bed IDs
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900"
          >
            <Plus className="h-3.5 w-3.5" />
            Generate Bed Inventory
          </button>
        </div>
      </form>

      <aside className="space-y-4">
        {previewIds.length > 0 && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
              Bed ID Preview
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {previewIds.map((id) => (
                <span
                  key={id}
                  className="rounded border border-sky-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-sky-900"
                >
                  {id}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b-2 border-slate-200 px-4 py-3">
            <Layers className="h-4 w-4 text-slate-800" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Mapped Containers ({containers.length})
            </h3>
          </div>
          <ul className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
            {containers.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-bold text-slate-900">{c.roomIdentifier}</p>
                    <p className="text-[11px] text-slate-800">{c.floorName}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase text-slate-800">
                      {getBranchName(c.branchId)} · {c.wardCategory}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-900">
                    <BedDouble className="h-3 w-3" />
                    {c.maxBedCount}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
