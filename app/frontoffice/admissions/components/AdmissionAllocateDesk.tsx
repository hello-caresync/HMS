'use client';

import { useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';

import {
  ADMISSION_PACKAGES,
  SEED_BED_MATRIX,
  WARD_TYPE_OPTIONS,
  type AdmissionAllocationDraft,
  type BedAllocationSelection,
  type SimulatedBedCell,
  type WardTypeOption,
} from '../../../lib/frontoffice';
import AllocationActionCard, { BedCellButton } from './AllocationActionCard';

export default function AdmissionAllocateDesk() {
  const [draft, setDraft] = useState<AdmissionAllocationDraft>({
    wardType: 'General Bed',
    packageId: ADMISSION_PACKAGES[0]?.id ?? '',
    depositAmount: 5000,
  });
  const [selectedBed, setSelectedBed] = useState<SimulatedBedCell | null>(null);
  const [allocationCard, setAllocationCard] = useState<BedAllocationSelection | null>(null);
  const [beds, setBeds] = useState(SEED_BED_MATRIX);

  const filteredBeds = useMemo(
    () => beds.filter((b) => b.wardType === draft.wardType),
    [beds, draft.wardType],
  );

  const handleBedClick = (bed: SimulatedBedCell) => {
    setSelectedBed(bed);
    setAllocationCard({ bed, draft });
  };

  const handleConfirm = () => {
    if (!allocationCard) return;
    setBeds((prev) =>
      prev.map((b) =>
        b.bedId === allocationCard.bed.bedId
          ? { ...b, state: 'occupied' as const, patientInitials: 'N.P.', uhid: 'NX-2026-NEWADM' }
          : b,
      ),
    );
    setAllocationCard(null);
    setSelectedBed(null);
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-sky-700" />
          <div>
            <h1 className="text-lg font-black text-slate-900">Admission Desk · Room Matrix</h1>
            <p className="text-xs text-slate-800">
              Phase 2 · Module 7 · Inpatient floor allocation control
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm lg:grid-cols-3">
        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Ward Type
          </span>
          <select
            value={draft.wardType}
            onChange={(e) =>
              setDraft((d) => ({ ...d, wardType: e.target.value as WardTypeOption }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          >
            {WARD_TYPE_OPTIONS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Admission Package
          </span>
          <select
            value={draft.packageId}
            onChange={(e) => setDraft((d) => ({ ...d, packageId: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          >
            {ADMISSION_PACKAGES.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.label} · ₹{pkg.baseRate.toLocaleString('en-IN')}/day
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Initial Deposit (₹)
          </span>
          <input
            type="number"
            min={0}
            step={500}
            value={draft.depositAmount}
            onChange={(e) =>
              setDraft((d) => ({ ...d, depositAmount: Number(e.target.value) || 0 }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wide">
        <span className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-emerald-800">
          <span className="h-2 w-2 rounded-sm bg-emerald-500" />
          Vacant
        </span>
        <span className="inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-amber-800">
          <span className="h-2 w-2 rounded-sm bg-amber-500" />
          Occupied
        </span>
        <span className="inline-flex items-center gap-1.5 rounded border border-slate-400 bg-slate-200 px-2 py-1 text-slate-900">
          <span className="h-2 w-2 rounded-sm bg-slate-500" />
          Maintenance
        </span>
      </div>

      <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-800">
          {draft.wardType} · Bed Matrix
        </p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {filteredBeds.map((bed) => (
            <BedCellButton
              key={bed.bedId}
              bed={bed}
              selected={selectedBed?.bedId === bed.bedId}
              onSelect={handleBedClick}
            />
          ))}
        </div>
      </div>

      <AllocationActionCard
        selection={allocationCard}
        onClose={() => setAllocationCard(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
