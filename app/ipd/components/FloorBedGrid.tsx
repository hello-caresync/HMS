'use client';

import { Building2, Layers } from 'lucide-react';

import { useIPD } from '../context/IPDProvider';
import { FLOORS } from '../types';
import type { FloorId, IPDBed, WardId } from '../types';
import BedBlockCard from './BedBlockCard';

type FloorBedGridProps = {
  onTransfer: (bed: IPDBed) => void;
  onBedSelect: (bed: IPDBed) => void;
  selectedBedId?: string;
};

export default function FloorBedGrid({ onTransfer, onBedSelect, selectedBedId }: FloorBedGridProps) {
  const {
    wards,
    beds,
    occupancyStats,
    selectedWardFilter,
    selectedFloorFilter,
    setSelectedWardFilter,
    setSelectedFloorFilter,
    selectAdmission,
    getAdmissionForBed,
  } = useIPD();

  const filteredWards = wards.filter((w) => {
    if (selectedWardFilter !== 'all' && w.id !== selectedWardFilter) return false;
    if (selectedFloorFilter !== 'all' && w.floorId !== selectedFloorFilter) return false;
    return true;
  });

  const handleBedSelect = (bed: IPDBed) => {
    onBedSelect(bed);
    const admission = getAdmissionForBed(bed.id);
    if (admission) selectAdmission(admission.id);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 border-b-2 border-slate-200 px-4 py-3">
        <div className="min-w-[140px]">
          <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-800">
            <Building2 className="h-3 w-3" />
            Ward
          </label>
          <select
            value={selectedWardFilter}
            onChange={(e) => setSelectedWardFilter(e.target.value as WardId | 'all')}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Wards</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[120px]">
          <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-800">
            <Layers className="h-3 w-3" />
            Floor
          </label>
          <select
            value={selectedFloorFilter}
            onChange={(e) => setSelectedFloorFilter(e.target.value as FloorId | 'all')}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Floors</option>
            {FLOORS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5 text-[10px] font-semibold">
          <LegendPill label="Occupied" className="bg-[#fef6e8] text-amber-800 ring-amber-200" count={occupancyStats.occupied} />
          <LegendPill label="Available" className="bg-[#edf8f3] text-emerald-800 ring-emerald-200" count={occupancyStats.available} />
          <LegendPill label="Housekeeping" className="bg-slate-100 text-slate-800 ring-slate-200" count={occupancyStats.housekeeping} />
        </div>
      </div>

      {/* Ward sections */}
      <div className="custom-scrollbar max-h-[420px] overflow-y-auto p-3 space-y-4">
        {filteredWards.map((ward) => {
          const wardBeds = beds.filter((b) => b.wardId === ward.id);
          const occupied = wardBeds.filter((b) => b.status === 'Occupied').length;

          return (
            <div key={ward.id}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{ward.name}</h3>
                  <p className="text-[10px] text-slate-800">{ward.floorLabel}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-900">
                  {occupied}/{wardBeds.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {wardBeds.map((bed) => (
                  <BedBlockCard
                    key={bed.id}
                    bed={bed}
                    dailyRate={ward.dailyRate}
                    onSelect={handleBedSelect}
                    onTransfer={onTransfer}
                    isSelected={selectedBedId === bed.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LegendPill({
  label,
  className,
  count,
}: {
  label: string;
  className: string;
  count: number;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${className}`}>
      {label}
      <span className="font-mono font-bold">{count}</span>
    </span>
  );
}
