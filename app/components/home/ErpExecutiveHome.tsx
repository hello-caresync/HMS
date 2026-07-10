'use client';

import {
  Activity,
  BedDouble,
  IndianRupee,
  Radio,
  ScrollText,
  Stethoscope,
  Users,
} from 'lucide-react';

const OPD_IPD_COUNTERS = [
  {
    id: 'opd-live',
    label: 'Live OPD Queue',
    value: 47,
    sub: '12 in consultation · 35 waiting',
    icon: Stethoscope,
    tone: 'sky' as const,
  },
  {
    id: 'ipd-census',
    label: 'IPD Census',
    value: 186,
    sub: '142 occupied · 44 available beds',
    icon: BedDouble,
    tone: 'indigo' as const,
  },
  {
    id: 'staff-on-duty',
    label: 'Staff On Duty',
    value: 214,
    sub: 'Across 6 active shift blocks',
    icon: Users,
    tone: 'slate' as const,
  },
  {
    id: 'emergency',
    label: 'Emergency Intake',
    value: 8,
    sub: '3 triage red · 5 observation',
    icon: Activity,
    tone: 'rose' as const,
  },
];

const COLLECTIONS = [
  { label: 'OPD Collections', amount: '₹ 8,42,500', delta: '+12.4%', tone: 'emerald' as const },
  { label: 'IPD & Procedures', amount: '₹ 14,20,000', delta: '+6.1%', tone: 'sky' as const },
  { label: 'Pharmacy Counter', amount: '₹ 3,15,800', delta: '+9.8%', tone: 'indigo' as const },
  { label: 'Insurance Settlements', amount: '₹ 6,08,200', delta: 'Pending TPA', tone: 'amber' as const },
];

const SYSTEM_LOG = [
  { time: '14:42:08', module: 'Appointments', event: 'Token CAR-024 issued · Cardiology OPD' },
  { time: '14:41:52', module: 'Billing', event: 'Invoice INV-20260710-1182 finalized · ₹ 4,850' },
  { time: '14:41:30', module: 'IPD', event: 'Bed ICU-A-06 marked occupied · admission sync' },
  { time: '14:40:11', module: 'Pharmacy', event: 'Formulary SKU PHM-006 reactivated by store admin' },
  { time: '14:39:44', module: 'Staff', event: 'Shift block SHF-OPD-MORNING roster updated (+2 nurses)' },
  { time: '14:38:19', module: 'Laboratory', event: 'Critical result flagged · LAB-CBC-001 · MRN-8821' },
  { time: '14:37:02', module: 'Procurement', event: 'PO-2026-044 approved · surgical consumables' },
  { time: '14:35:50', module: 'Settings', event: 'Bed container CCU-01 inventory regenerated (6 beds)' },
];

const TONE_STYLES = {
  sky: 'border-sky-200 bg-sky-50 text-sky-800',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  slate: 'border-slate-200 bg-white text-slate-800',
  rose: 'border-rose-200 bg-rose-50 text-rose-800',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
};

export default function ErpExecutiveHome() {
  const today = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const totalCollections = '₹ 31,86,500';

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
            <Radio className="h-3 w-3 animate-pulse" />
            Live Operations
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-800">
            Central Hospital Back-Office ERP
          </span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Executive Operations Cockpit
        </h1>
        <p className="mt-1 text-sm text-slate-800">{today} · Nexora Multi-Specialty Campus</p>
      </header>

      <section>
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800">
          Live OPD / IPD Counters
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {OPD_IPD_COUNTERS.map((block) => {
            const Icon = block.icon;
            return (
              <div
                key={block.id}
                className={`rounded-xl border p-4 shadow-sm ${TONE_STYLES[block.tone]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {block.label}
                    </p>
                    <p className="mt-1 text-3xl font-black tabular-nums">{block.value}</p>
                  </div>
                  <Icon className="h-5 w-5 shrink-0 opacity-60" />
                </div>
                <p className="mt-2 text-[11px] font-medium opacity-90">{block.sub}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800">
            Today&apos;s Collections
          </h2>
          <p className="flex items-center gap-1.5 text-sm font-black text-slate-900">
            <IndianRupee className="h-4 w-4 text-emerald-600" />
            Gross Total · {totalCollections}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {COLLECTIONS.map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border p-4 shadow-sm ${TONE_STYLES[card.tone]}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                {card.label}
              </p>
              <p className="mt-2 text-xl font-black tabular-nums">{card.amount}</p>
              <p className="mt-1 text-[11px] font-semibold opacity-90">{card.delta}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-300 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b-2 border-slate-200 px-4 py-3">
          <ScrollText className="h-4 w-4 text-slate-800" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Automated System Log
          </h2>
          <span className="ml-auto rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800">
            Live feed
          </span>
        </div>
        <ul className="divide-y divide-slate-100">
          {SYSTEM_LOG.map((entry) => (
            <li
              key={`${entry.time}-${entry.module}`}
              className="grid gap-2 px-4 py-2.5 text-sm sm:grid-cols-[88px_120px_1fr]"
            >
              <span className="font-mono text-[11px] font-bold tabular-nums text-slate-800">
                {entry.time}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wide text-sky-700">
                {entry.module}
              </span>
              <span className="text-xs text-slate-900">{entry.event}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
