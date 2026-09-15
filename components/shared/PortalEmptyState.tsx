'use client';

import type { LucideIcon } from 'lucide-react';

type PortalEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  surfaceClass?: string;
  accentClass?: string;
};

export function PortalEmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
  surfaceClass = 'bg-[#F7F6F3] border-dashed border-slate-200',
  accentClass = 'text-slate-400',
}: PortalEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border px-6 py-12 text-center ${surfaceClass}`}
    >
      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-inner ${accentClass}`}>
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <p className="mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-slate-500">{body}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition hover:opacity-90"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
