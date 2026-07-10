'use client';

import React, { useEffect, useState } from 'react';

import { POExtendedStatus } from '../types';

const BADGE_BASE =
  'inline-flex items-center px-2.5 py-0.5 text-[10px] uppercase font-black tracking-wider rounded-md border';

export const inputClassName =
  'w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-900 shadow-3xs placeholder:text-slate-800 transition-all focus:outline-none focus:border-blue-600';

export const selectClassName =
  'border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-900 shadow-3xs transition-all focus:outline-none focus:border-blue-600 cursor-pointer';

export const cardClassName =
  'relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-xs p-5 transition-all hover:shadow-md';

export const panelClassName =
  'bg-white border border-slate-200 rounded-2xl shadow-xs transition-all hover:shadow-md';

export const nestedPanelClassName =
  'bg-slate-50/70 border border-slate-200 rounded-xl p-4';

export const overlineClassName =
  'text-[11px] font-black uppercase tracking-wider text-slate-800 font-mono';

export const sectionTitleClassName =
  'text-base font-black text-slate-800 tracking-tight';

export const btnPrimaryClassName =
  'inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-[0.98]';

export const btnLogisticsClassName =
  'inline-flex items-center justify-center bg-[#4A5D5E] hover:bg-slate-800 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-[0.98]';

export const btnOutlineClassName =
  'inline-flex items-center justify-center bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 font-black text-xs px-5 py-2.5 rounded-xl shadow-3xs transition-all cursor-pointer active:scale-[0.98]';

export const btnSuccessClassName =
  'inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98]';

/** @deprecated Use btnPrimaryClassName */
export const btnAccentClassName = btnPrimaryClassName;

/** @deprecated Use btnOutlineClassName */
export const btnSecondaryClassName = btnOutlineClassName;

const STATUS_STYLES: Record<string, string> = {
  New: 'bg-blue-50 text-blue-700 border-blue-200',
  Created: 'bg-blue-50 text-blue-700 border-blue-200',
  Accepted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Packed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Dispatched: 'bg-amber-50 text-amber-700 border-amber-200',
  'In Transit': 'bg-amber-50 text-amber-700 border-amber-200',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Received & Replaced': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-600 border-rose-200',
  Critical: 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse',
  Urgent: 'bg-amber-50 text-amber-700 border-amber-200',
  Normal: 'bg-slate-50 text-slate-800 border-slate-200',
  Draft: 'bg-slate-50 text-slate-800 border-slate-200',
  Submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  'Under Review': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Approved: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Pending Review': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Expired: 'bg-rose-50 text-rose-600 border-rose-200',
  'Pending Pickup': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Credit Note Issued': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function StatusBadge({ label }: { label: string }) {
  return (
    <span className={`${BADGE_BASE} ${STATUS_STYLES[label] ?? 'bg-slate-50 text-slate-800 border-slate-200'}`}>
      {label}
    </span>
  );
}

export function poStatusBadge(status: POExtendedStatus) {
  return <StatusBadge label={status} />;
}

type PageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {title}
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-800">{description}</p>
      </div>
      {action}
    </div>
  );
}

type FilterBarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterOptions: { value: string; label: string }[];
};

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterValue,
  onFilterChange,
  filterOptions,
}: FilterBarProps) {
  return (
    <div className={`${panelClassName} flex flex-col gap-3 p-4 transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between`}>
      <div className="relative w-full sm:max-w-sm">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          className={inputClassName}
        />
      </div>
      <select
        value={filterValue}
        onChange={(event) => onFilterChange(event.target.value)}
        className={`${selectClassName} w-full sm:w-auto`}
      >
        {filterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className={`${panelClassName} py-14 text-center`}>
      <p className="text-xs font-medium text-slate-800">{message}</p>
    </div>
  );
}

export function ModuleSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-16 rounded-2xl bg-slate-200/70" />
      <div className="h-36 rounded-2xl bg-slate-200/60" />
      <div className="h-36 rounded-2xl bg-slate-200/50" />
    </div>
  );
}

export function DashboardShellSkeleton() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F4F7F6] text-slate-900 flex flex-col font-sans antialiased">
      <header className="shrink-0 z-30 flex items-center justify-between border-b border-[#3d4f50] bg-[#4A5D5E] px-6 py-3.5">
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded-md bg-white/20" />
          <div className="h-5 w-72 animate-pulse rounded-md bg-white/15" />
        </div>
        <div className="h-10 w-44 animate-pulse rounded-xl bg-[#3d4f50]/80" />
      </header>

      <div className="relative flex w-full flex-1 overflow-hidden">
        <aside className="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-800/80 bg-[#0f172a] p-4 custom-scrollbar">
          <div className="mb-6 space-y-2 border-b border-white/5 pb-4">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-700/70" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-xl bg-white/5"
              />
            ))}
          </div>
        </aside>

        <main className="custom-scrollbar flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#F4F7F6]">
          <div className="mx-auto w-full max-w-5xl shrink-0 px-6 pt-6 pb-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse overflow-hidden rounded-2xl border border-slate-200/60 bg-white pt-6 shadow-xs"
                >
                  <div className="mx-5 h-2 animate-pulse rounded bg-slate-200/80" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-24">
            <div className="mx-auto max-w-5xl">
              <ModuleSkeleton />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function ModuleTransition({
  moduleKey,
  children,
}: {
  moduleKey: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [moduleKey]);

  return (
    <div
      className={`space-y-6 transition-opacity duration-300 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {children}
    </div>
  );
}

type KpiCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose';
};

const ACCENT_GRADIENT: Record<NonNullable<KpiCardProps['accent']>, string> = {
  blue: 'bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-400',
  indigo: 'bg-gradient-to-r from-indigo-500 via-violet-400 to-purple-400',
  emerald: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400',
  amber: 'bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400',
  rose: 'bg-gradient-to-r from-rose-500 via-pink-400 to-red-400',
};

export function KpiCard({
  label,
  value,
  hint,
  accent = 'blue',
}: KpiCardProps) {
  return (
    <div className="relative flex flex-col gap-1 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 pt-6 shadow-xs transition-all hover:shadow-md">
      <span
        className={`absolute top-0 right-0 left-0 h-1 ${ACCENT_GRADIENT[accent]}`}
        aria-hidden
      />
      <span className={overlineClassName}>{label}</span>
      <span className="font-mono text-2xl font-black tracking-tight text-slate-800 tabular-nums">
        {value}
      </span>
      {hint && (
        <span className="text-xs font-medium text-slate-800">{hint}</span>
      )}
    </div>
  );
}

export function CardAccentBar({
  color = 'indigo',
}: {
  color?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose';
}) {
  const barColor: Record<typeof color, string> = {
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <span
      className={`absolute top-0 left-0 h-full w-1 ${barColor[color]}`}
      aria-hidden
    />
  );
}

export function GlobalMetricsSummary({
  newPoCount,
  inPipelineCount,
  openInvoicesCount,
}: {
  newPoCount: number;
  inPipelineCount: number;
  openInvoicesCount: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard
        label="New purchase orders"
        value={newPoCount}
        hint="Awaiting vendor action"
        accent={newPoCount > 0 ? 'amber' : 'blue'}
      />
      <KpiCard
        label="In fulfillment"
        value={inPipelineCount}
        hint="Processing through logistics"
        accent="indigo"
      />
      <KpiCard
        label="Open invoices"
        value={openInvoicesCount}
        hint="Pending settlement"
        accent="rose"
      />
    </div>
  );
}
