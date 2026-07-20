'use client';

import { Search } from 'lucide-react';

type QuickPatientLookupProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectPatient?: (uhid: string) => void;
  resultCount?: number;
};

export default function QuickPatientLookup({
  value,
  onChange,
  resultCount,
}: QuickPatientLookupProps) {
  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Quick Patient Lookup — UHID, Name, Phone, or Insurance ID"
            aria-label="Quick Patient Lookup"
            className="w-full rounded-md border border-slate-200 bg-[#F8FAFC] py-1.5 pl-8 pr-3 text-[11px] text-[#0F172A] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[10px] text-slate-500">
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[9px]">Ctrl+K</kbd>
          {resultCount !== undefined && value.trim() && (
            <span className="font-semibold text-[#2563EB]">{resultCount} match{resultCount !== 1 ? 'es' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}
