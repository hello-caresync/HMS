'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { RefreshCw, Search } from 'lucide-react';

export type KpiItem = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'blue';
};

const toneMap = {
  cyan: 'bg-cyan-500/10 text-cyan-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-400',
  rose: 'bg-rose-500/10 text-rose-400',
  indigo: 'bg-indigo-500/10 text-indigo-400',
  blue: 'bg-blue-500/10 text-blue-400',
};

export function ViewHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
}) {
  return (
    <div className="border-b border-slate-800 pb-5">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
        <Icon className="h-6 w-6 text-cyan-400" />
        {title}
      </h1>
      <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

export function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const KpiIcon = item.icon;
        const tone = toneMap[item.tone ?? 'cyan'];
        return (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#1e293b] p-4 shadow-sm"
          >
            <div>
              <p className="text-xs font-semibold text-slate-400">{item.label}</p>
              <p className="mt-1 text-xl font-bold text-white">{item.value}</p>
              {item.hint && <p className="mt-0.5 text-[10px] text-slate-500">{item.hint}</p>}
            </div>
            <div className={`rounded-xl p-2.5 ${tone.split(' ')[0]}`}>
              <KpiIcon className={`h-5 w-5 ${tone.split(' ')[1]}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SearchDesk({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#1e293b] p-3 shadow-sm">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-800 bg-slate-900/50 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
      >
        <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
        Sync
      </button>
    </div>
  );
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
            active === tab.id
              ? 'bg-[#1e3a8a] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-[#1e293b] p-4 shadow-sm ${className}`}
    >
      <div className="mb-3">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {columns.map((col) => (
              <th key={col} className="px-3 py-2">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-slate-300">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-slate-900/30">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
