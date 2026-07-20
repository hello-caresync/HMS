'use client';

import { LayoutGrid, Search, SlidersHorizontal } from 'lucide-react';

import type { HpRolePersona } from '../hpWorkspaceNav.types';
import { ROLE_PERSONAS } from '../hpWorkspaceNav.types';
import { RoleBadge } from './hpWorkspaceUi';

type HpWorkspaceModuleHeaderProps = {
  lookupValue: string;
  onLookupChange: (value: string) => void;
  resultCount?: number;
  activeRole: HpRolePersona;
  onRoleChange: (role: HpRolePersona) => void;
  widgetsExpanded: boolean;
  onToggleWidgets: () => void;
};

export default function HpWorkspaceModuleHeader({
  lookupValue,
  onLookupChange,
  resultCount,
  activeRole,
  onRoleChange,
  widgetsExpanded,
  onToggleWidgets,
}: HpWorkspaceModuleHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[#E2E8F0] bg-white px-4 py-2">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-[#0F172A]">HP Workspace</h1>
          <p className="text-[9px] text-slate-500">Hospital Professional command center · persona-adaptive cockpit · clinical suites · compliance & AI</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-bold uppercase text-slate-500">Context:</span>
            <select
              value={activeRole}
              onChange={(e) => onRoleChange(e.target.value as HpRolePersona)}
              aria-label="Role context selector"
              className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1 text-[9px] font-bold text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
            >
              {ROLE_PERSONAS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <RoleBadge role={activeRole} />
          </div>
          <button
            type="button"
            onClick={onToggleWidgets}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-bold uppercase transition-colors ${
              widgetsExpanded ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]' : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
            aria-pressed={widgetsExpanded}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Widgets {widgetsExpanded ? 'On' : 'Compact'}
          </button>
          <span className="inline-flex items-center gap-1 rounded-md border border-[#2563EB]/30 bg-[#2563EB]/5 px-2 py-1 text-[9px] font-bold uppercase text-[#2563EB]">
            <LayoutGrid className="h-3.5 w-3.5" />
            Command Center Live
          </span>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={lookupValue}
          onChange={(e) => onLookupChange(e.target.value)}
          placeholder="Universal search — Patients, Doctors, Staff, Invoices, Labs, Purchase Orders"
          aria-label="Universal search"
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
