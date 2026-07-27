'use client';

import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { nxUi } from '@/lib/doctor/design-system';

export function WorkspaceHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumb,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          {eyebrow && (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7A7558]">{eyebrow}</p>
          )}
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#1C1B18] lg:text-[26px]">{title}</h1>
          {description && <p className="mt-1.5 text-[13px] leading-relaxed text-[#6B6860]">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function MetricTile({
  label,
  value,
  delta,
  sub,
  accent,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: string | number;
  delta?: string;
  sub?: string;
  accent?: 'default' | 'live' | 'critical' | 'warning';
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  const accentBorder =
    accent === 'critical'
      ? 'border-l-[#DC2626]'
      : accent === 'live'
        ? 'border-l-[#10B981]'
        : accent === 'warning'
          ? 'border-l-[#D97706]'
          : 'border-l-[#7A7558]';

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`${nxUi.card} border-l-[3px] ${accentBorder} p-4 text-left ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#9C9890]">{label}</p>
          <p className="mt-1 text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-[#1C1B18]">{value}</p>
          {(delta || sub) && (
            <p className="mt-0.5 text-[12px] text-[#6B6860]">
              {delta && <span className="font-semibold text-[#7A7558]">{delta} </span>}
              {sub}
            </p>
          )}
        </div>
        {Icon && (
          <span className="rounded-lg bg-[#F3F2ED] p-2 text-[#7A7558]">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
    </Wrapper>
  );
}

export function WeekNavigator({
  label,
  onPrev,
  onNext,
  onToday,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onPrev} className={nxUi.btnGhost + ' !p-2'} aria-label="Previous week">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button type="button" onClick={onToday} className={`${nxUi.chip} min-w-[140px] justify-center`}>
        {label}
      </button>
      <button type="button" onClick={onNext} className={nxUi.btnGhost + ' !p-2'} aria-label="Next week">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function LiveIndicator({ label = 'Live' }: { label?: string }) {
  return (
    <span className={nxUi.chipLive}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      {label}
    </span>
  );
}

export function EmptyClinicalState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={`${nxUi.shell} flex flex-col items-center px-6 py-14 text-center`}>
      <span className="rounded-2xl bg-[#F3F2ED] p-4 text-[#7A7558]">
        <Icon className="h-8 w-8" aria-hidden />
      </span>
      <p className="mt-4 text-[15px] font-semibold text-[#1C1B18]">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-[#6B6860]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
