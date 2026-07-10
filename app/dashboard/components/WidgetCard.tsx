'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type WidgetCardProps = {
  title: string;
  icon: LucideIcon;
  iconClassName?: string;
  children: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
  /** Inverse tone for high-contrast alert cards */
  tone?: 'default' | 'inverse';
};

export default function WidgetCard({
  title,
  icon: Icon,
  iconClassName = 'text-primary',
  children,
  className = '',
  headerExtra,
  tone = 'default',
}: WidgetCardProps) {
  const inverse = tone === 'inverse';

  return (
    <article
      className={`flex flex-col rounded-2xl border p-4 shadow-xs transition-shadow hover:shadow-md sm:p-5 ${
        inverse
          ? 'border-red-300/50'
          : 'border-slate-200/80 bg-white'
      } ${className}`}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${
              inverse ? 'bg-white/15 ring-white/20' : 'bg-slate-50 ring-slate-100'
            }`}
          >
            <Icon className={`h-4 w-4 ${iconClassName}`} strokeWidth={2} />
          </span>
          <h3
            className={`text-sm font-semibold tracking-tight ${
              inverse ? 'text-white' : 'text-slate-800'
            }`}
          >
            {title}
          </h3>
        </div>
        {headerExtra}
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </article>
  );
}
