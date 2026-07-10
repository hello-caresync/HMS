'use client';

import { ArrowRightLeft, BedDouble, Sparkles } from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import { useIPD } from '../context/IPDProvider';
import type { IPDBed } from '../types';
import { getPatientInitials } from '../types';

type BedBlockCardProps = {
  bed: IPDBed;
  dailyRate: number;
  onSelect: (bed: IPDBed) => void;
  onTransfer: (bed: IPDBed) => void;
  isSelected: boolean;
};

export default function BedBlockCard({
  bed,
  dailyRate,
  onSelect,
  onTransfer,
  isSelected,
}: BedBlockCardProps) {
  const { getAdmissionForBed } = useIPD();
  const admission = getAdmissionForBed(bed.id);
  const isOccupied = bed.status === 'Occupied' && admission;

  const baseRing = isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : '';

  if (bed.status === 'Housekeeping') {
    return (
      <div
        className={`ipd-bed-housekeeping relative flex min-h-[72px] flex-col rounded-lg border border-slate-300 p-2 ${baseRing}`}
        title="Pending Housekeeping / Disinfection"
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold text-slate-800">{bed.bedLabel}</span>
          <span className="text-[8px] font-bold uppercase tracking-wide text-slate-800">HK</span>
        </div>
        <p className="mt-auto text-[9px] font-medium text-slate-800">Disinfection</p>
      </div>
    );
  }

  if (isOccupied && admission) {
    const initials = getPatientInitials(admission.patientName);
    return (
      <button
        type="button"
        onClick={() => onSelect(bed)}
        className={`group flex min-h-[72px] flex-col rounded-lg border-2 border-amber-200 bg-[#fef6e8] p-2 text-left transition hover:border-amber-300 hover:shadow-md ${baseRing}`}
      >
        <div className="flex items-start justify-between gap-1">
          <span className="font-mono text-[10px] font-bold text-amber-900">{bed.bedLabel}</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-200/80 text-[10px] font-bold text-amber-900">
            {initials}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] font-semibold text-amber-950">{admission.patientName}</p>
        <p className="font-mono text-[8px] text-amber-700">{admission.uhid}</p>
        {!admission.recordLocked && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onTransfer(bed);
            }}
            onKeyDown={(e) => e.key === 'Enter' && onTransfer(bed)}
            className="mt-1.5 inline-flex items-center gap-0.5 self-start rounded bg-amber-800/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white opacity-0 transition group-hover:opacity-100"
          >
            <ArrowRightLeft className="h-2.5 w-2.5" />
            Transfer / Upgrade
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`flex min-h-[72px] flex-col rounded-lg border-2 border-emerald-200 bg-[#edf8f3] p-2 ${baseRing}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold text-emerald-800">{bed.bedLabel}</span>
        <Sparkles className="h-3 w-3 text-emerald-500" />
      </div>
      <p className="mt-auto text-[9px] font-semibold text-emerald-700">Available · Cleaned</p>
      <p className="text-[8px] text-emerald-600">{formatCurrency(dailyRate)}/day</p>
    </div>
  );
}
