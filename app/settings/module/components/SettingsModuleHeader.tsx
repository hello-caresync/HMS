'use client';

import { Cog, Search } from 'lucide-react';

import { settingsType } from './settingsUi';

type SettingsModuleHeaderProps = {
  lookupValue: string;
  onLookupChange: (value: string) => void;
  resultCount?: number;
};

export default function SettingsModuleHeader({ lookupValue, onLookupChange, resultCount }: SettingsModuleHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[#E2E8F0] bg-white px-5 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={settingsType.canvasTitle}>Settings Management</h1>
          <p className={`mt-1 ${settingsType.canvasSubtitle}`}>
            ERP configuration engine · access controls · module architecture · integrations · security · compliance
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-[#2563EB]/30 bg-[#2563EB]/5 px-3 py-2 text-base font-bold text-[#2563EB]">
          <Cog className="h-5 w-5" />
          Configuration Console Active
        </span>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={lookupValue}
          onChange={(e) => onLookupChange(e.target.value)}
          placeholder="Search settings — user, integration, module, workflow, security, or compliance"
          aria-label="Search settings"
          className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-3 pl-10 pr-4 text-base text-[#0F172A] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {resultCount !== undefined && lookupValue.trim() && resultCount > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base font-semibold text-[#2563EB]">
            {resultCount} match{resultCount !== 1 ? 'es' : ''}
          </span>
        )}
      </div>
    </header>
  );
}
