'use client';

import type { ReactNode } from 'react';

import { doctorUi } from '@/lib/nexora-doctor/design-tokens';

import { cn, ui } from './primitives';

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 w-48 rounded-lg bg-[#D8E2DC]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-[#E2E8E0]/60" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-32 rounded-xl bg-[#E2E8E0]/60" />
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E2E8E0] bg-[#F4F6F0]/50 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-[#7A9A8B]/60">{icon}</div>}
      <h3 className="text-base font-semibold text-[#2C3531]">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-[#2C3531]/60">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-[#D96B52]/30 bg-[#FDF0ED] px-6 py-8 text-center">
      <p className="text-sm font-medium text-[#D96B52]">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${ui.link} mt-3`}>
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
  accent?: 'sage' | 'pending' | 'warning' | 'neutral';
}) {
  const valueClass = {
    sage: 'text-[#7A9A8B]',
    pending: 'text-[#9A8938]',
    warning: 'text-[#D96B52]',
    neutral: 'text-[#2C3531]',
  }[accent ?? 'neutral'];

  return (
    <div className={ui.card}>
      <p className="text-xs font-medium uppercase tracking-wide text-[#2C3531]/60">{label}</p>
      <p className={cn('mt-2 text-2xl font-semibold tabular-nums', valueClass)}>{value}</p>
      {sub && <p className="mt-1 text-xs text-[#2C3531]/50">{sub}</p>}
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
      className={`${ui.input} max-w-xs`}
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
              ? 'bg-[#7A9A8B] text-white'
              : 'border border-[#E2E8E0] bg-[#FAFCF8] text-[#2C3531]/70 hover:bg-[#F4F6F0]',
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
    <div className="mb-4 flex items-center justify-between border-b border-[#E2E8E0] pb-3">
      <h2 className="text-sm font-semibold text-[#2C3531]">{title}</h2>
      {action}
    </div>
  );
}
