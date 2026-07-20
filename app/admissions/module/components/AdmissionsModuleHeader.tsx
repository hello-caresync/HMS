'use client';

import { Search, UserPlus } from 'lucide-react';

type AdmissionsModuleHeaderProps = {
  lookupValue: string;
  onLookupChange: (value: string) => void;
  resultCount?: number;
  onAdmitClick: () => void;
};

export default function AdmissionsModuleHeader({ lookupValue, onLookupChange, resultCount, onAdmitClick }: AdmissionsModuleHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[#E2E8F0] bg-white px-4 py-2.5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-[#0F172A]">Admissions Management</h1>
          <p className="text-[10px] text-slate-500">Intake · bed matrix · finance · discharge clearance · IPD lifecycle</p>
        </div>
        <button
          type="button"
          onClick={onAdmitClick}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-blue-700"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Admit Patient
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={lookupValue}
          onChange={(e) => onLookupChange(e.target.value)}
          placeholder="Search admissions — UHID, patient name, request ID, or ward"
          aria-label="Search admissions"
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
