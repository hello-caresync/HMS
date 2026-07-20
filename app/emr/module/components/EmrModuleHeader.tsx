'use client';

import { Download, Printer, Search } from 'lucide-react';

import type { EmrPatient } from '../lib/emrMockData';
import { ViewOnlyBadge } from './emrUi';

type EmrModuleHeaderProps = {
  lookupValue: string;
  onLookupChange: (value: string) => void;
  matchFound: boolean;
  patient: EmrPatient;
  onPrintFull: () => void;
  onExportSummary: () => void;
};

export default function EmrModuleHeader({
  lookupValue,
  onLookupChange,
  matchFound,
  patient,
  onPrintFull,
  onExportSummary,
}: EmrModuleHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[#E2E8F0] bg-white px-4 py-2">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-bold text-[#0F172A]">Electronic Medical Records</h1>
            <ViewOnlyBadge compact />
          </div>
          <p className="text-[9px] text-slate-500">
            Audited clinical vault · {patient.name} · <span className="font-mono text-[#2563EB]">{patient.uhid}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={onPrintFull}
            className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[9px] font-bold uppercase text-[#0F172A] hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5 text-[#2563EB]" />
            Print Full EMR Record
          </button>
          <button
            type="button"
            onClick={onExportSummary}
            className="inline-flex items-center gap-1 rounded-md bg-[#2563EB] px-2.5 py-1.5 text-[9px] font-bold uppercase text-white hover:bg-blue-700"
          >
            <Download className="h-3.5 w-3.5" />
            Export Certified Clinical Summary
          </button>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={lookupValue}
          onChange={(e) => onLookupChange(e.target.value)}
          placeholder="Global Patient EMR Search — UHID, name, or diagnostic episode"
          aria-label="Global Patient EMR Search"
          className="w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 pl-8 pr-3 text-[10px] text-[#0F172A] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {lookupValue.trim() && (
          <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold ${matchFound ? 'text-emerald-600' : 'text-red-600'}`}>
            {matchFound ? 'Patient match' : 'No match'}
          </span>
        )}
      </div>
    </header>
  );
}
