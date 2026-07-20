'use client';

import { Settings, Search } from 'lucide-react';

type AdministrationModuleHeaderProps = {
  lookupValue: string;
  onLookupChange: (value: string) => void;
  resultCount?: number;
};

export default function AdministrationModuleHeader({ lookupValue, onLookupChange, resultCount }: AdministrationModuleHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[#E2E8F0] bg-white px-4 py-2">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-[#0F172A]">Administration Management</h1>
          <p className="text-[9px] text-slate-500">Hospital governance · operations command · RBAC · compliance · incidents · AI intelligence</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md border border-[#2563EB]/30 bg-[#2563EB]/5 px-2 py-1 text-[9px] font-bold uppercase text-[#2563EB]">
          <Settings className="h-3.5 w-3.5" />
          Governance Console Active
        </span>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={lookupValue}
          onChange={(e) => onLookupChange(e.target.value)}
          placeholder="Search administration — user, incident, compliance, policy, or department"
          aria-label="Search administration"
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
