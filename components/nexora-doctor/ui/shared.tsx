'use client';

import type { ReactNode } from 'react';

import { cn } from './primitives';

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-6 p-6 lg:p-8">
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-32 rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-slate-400">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
      <p className="text-sm font-medium text-red-800">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'teal' | 'amber' | 'red' | 'slate';
}) {
  const accentClass = {
    teal: 'text-teal-700 bg-teal-50',
    amber: 'text-amber-700 bg-amber-50',
    red: 'text-red-700 bg-red-50',
    slate: 'text-slate-700 bg-slate-100',
  }[accent ?? 'slate'];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-2 text-2xl font-semibold tabular-nums', accentClass.split(' ')[0])}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
    />
  );
}

export function FilterTabs({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-xs font-medium transition',
            value === opt.id
              ? 'bg-teal-700 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
  );
}
