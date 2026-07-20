'use client';

import { BarChart3, Search } from 'lucide-react';

type ReportsModuleHeaderProps = {
  lookupValue: string;
  onLookupChange: (value: string) => void;
  resultCount?: number;
};

export default function ReportsModuleHeader({ lookupValue, onLookupChange, resultCount }: ReportsModuleHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[#E2E8F0] bg-white px-4 py-2">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-[#0F172A]">Reports & Analytics (HBI)</h1>
          <p className="text-[9px] text-slate-500">Hospital Business Intelligence · executive cockpit · clinical analytics · finance & AI forecasting</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-[9px] font-bold uppercase text-teal-800">
          <BarChart3 className="h-3.5 w-3.5" />
          HBI Engine Live
        </span>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={lookupValue}
          onChange={(e) => onLookupChange(e.target.value)}
          placeholder="Search reports — department, metric, TPA, doctor, or analytics view"
          aria-label="Search reports"
          className="w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 pl-8 pr-3 text-[10px] text-[#0F172A] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {resultCount !== undefined && lookupValue.trim() && resultCount > 0 && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-[#2563EB]">
            {resultCount} match{resultCount !== 1 ? 'es' : ''}
          </span>
        )}
      </div>
    </header>
  );
}
