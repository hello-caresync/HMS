'use client';

import { BedDouble, X } from 'lucide-react';

import type { BedAllocationSelection, SimulatedBedCell } from '../../../lib/frontoffice';

type AllocationActionCardProps = {
  selection: BedAllocationSelection | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AllocationActionCard({
  selection,
  onClose,
  onConfirm,
}: AllocationActionCardProps) {
  if (!selection) return null;

  const { bed, draft } = selection;
  const pkg = draft.packageId;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40" onClick={onClose} aria-hidden />
      <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-xl border border-slate-300 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
              <BedDouble className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Bed Allocation / Transfer</p>
              <p className="font-mono text-xs text-slate-800">{bed.label}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-800 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border border-slate-200 bg-slate-50 p-2">
            <dt className="text-[9px] font-bold uppercase text-slate-800">Ward</dt>
            <dd className="font-semibold text-slate-800">{draft.wardType}</dd>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-2">
            <dt className="text-[9px] font-bold uppercase text-slate-800">Package</dt>
            <dd className="font-semibold text-slate-800">{pkg}</dd>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-2 col-span-2">
            <dt className="text-[9px] font-bold uppercase text-slate-800">Deposit Collected</dt>
            <dd className="font-mono text-sm font-black text-emerald-700">
              ₹ {draft.depositAmount.toLocaleString('en-IN')}
            </dd>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-2 col-span-2">
            <dt className="text-[9px] font-bold uppercase text-slate-800">Bed State</dt>
            <dd className="font-semibold capitalize text-slate-800">{bed.state}</dd>
          </div>
        </dl>

        <p className="mt-3 text-[11px] text-slate-800">
          Operational placeholder — confirms allocation handshake with IPD census and billing
          deposit ledger.
        </p>

        <button
          type="button"
          onClick={onConfirm}
          className="mt-4 w-full rounded-lg bg-slate-800 py-2.5 text-sm font-bold text-white hover:bg-slate-900"
        >
          Confirm Allocation
        </button>
      </div>
    </>
  );
}

function BedCellButton({
  bed,
  selected,
  onSelect,
}: {
  bed: SimulatedBedCell;
  selected: boolean;
  onSelect: (bed: SimulatedBedCell) => void;
}) {
  const styles = {
    vacant: 'border-emerald-300 bg-emerald-50 hover:border-emerald-400 text-emerald-900',
    occupied: 'border-amber-300 bg-amber-50 text-amber-900 cursor-pointer hover:border-amber-400',
    maintenance: 'border-slate-400 bg-slate-200 text-slate-800 cursor-not-allowed ipd-bed-housekeeping',
  }[bed.state];

  return (
    <button
      type="button"
      disabled={bed.state === 'maintenance'}
      onClick={() => onSelect(bed)}
      className={`flex min-h-[64px] flex-col rounded-lg border-2 p-2 text-left text-xs transition ${styles} ${
        selected ? 'ring-2 ring-sky-500 ring-offset-1' : ''
      }`}
    >
      <span className="font-mono text-[10px] font-black">{bed.label}</span>
      {bed.state === 'occupied' && (
        <>
          <span className="mt-1 font-bold">{bed.patientInitials}</span>
          <span className="font-mono text-[9px] opacity-80">{bed.uhid}</span>
        </>
      )}
      {bed.state === 'vacant' && (
        <span className="mt-auto text-[9px] font-bold uppercase text-emerald-700">Vacant</span>
      )}
      {bed.state === 'maintenance' && (
        <span className="mt-auto text-[9px] font-bold uppercase">Maintenance</span>
      )}
    </button>
  );
}

export { BedCellButton };
