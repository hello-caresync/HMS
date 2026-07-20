'use client';

import { Search, UserRound } from 'lucide-react';

type IpdModuleHeaderProps = {
  lookupValue: string;
  onLookupChange: (value: string) => void;
  resultCount?: number;
  selectedPatient?: string;
  onViewInpatient: () => void;
};

export default function IpdModuleHeader({
  lookupValue,
  onLookupChange,
  resultCount,
  selectedPatient,
  onViewInpatient,
}: IpdModuleHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[#E2E8F0] bg-white px-4 py-2.5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-[#0F172A]">IPD Operations</h1>
          <p className="text-[10px] text-slate-500">
            Inpatient census · ward capacity · nursing · discharge clearance
            {selectedPatient && (
              <span className="ml-2 font-semibold text-[#2563EB]">· Selected: {selectedPatient}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onViewInpatient}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-blue-700"
        >
          <UserRound className="h-3.5 w-3.5" />
          View Inpatient
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={lookupValue}
          onChange={(e) => onLookupChange(e.target.value)}
          placeholder="Filter inpatients — UHID, name, ward, room, or bed"
          aria-label="Filter inpatients"
          className="w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-8 pr-3 text-[11px] text-[#0F172A] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {resultCount !== undefined && lookupValue.trim() && resultCount > 0 && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#2563EB]">
            {resultCount} match{resultCount !== 1 ? 'es' : ''}
          </span>
        )}
      </div>
    </header>
  );
}
