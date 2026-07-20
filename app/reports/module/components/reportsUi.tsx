'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Lock, X } from 'lucide-react';
import type { ReactNode } from 'react';

export function HbiPanel({
  title,
  subtitle,
  icon: Icon,
  children,
  headerRight,
  className = '',
  critical,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  critical?: boolean;
}) {
  return (
    <section className={`rounded-md border bg-white shadow-sm ${critical ? 'border-red-300 ring-1 ring-red-200' : 'border-[#E2E8F0]'} ${className}`}>
      <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-1.5">
        <div className="flex min-w-0 items-start gap-2">
          {Icon && (
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${critical ? 'bg-red-600' : 'bg-[#0F172A]'}`}>
              <Icon className="h-3 w-3 text-white" strokeWidth={2} />
            </span>
          )}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#0F172A]">{title}</h3>
            {subtitle && <p className="text-[9px] text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {headerRight}
      </header>
      <div className="p-2">{children}</div>
    </section>
  );
}

export function SecurePatientPlaceholder({ hipaa }: { hipaa?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-teal-100 bg-teal-50/60 px-2 py-1">
      <Lock className="h-3 w-3 shrink-0 text-teal-700" aria-hidden />
      <span className="text-[8px] italic text-teal-800">[Patient Identifiers Masked for Security Compliance]</span>
      {hipaa && (
        <span className="ml-auto inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[7px] font-bold uppercase text-emerald-800">
          <CheckCircle2 className="h-2.5 w-2.5" />
          HIPAA Audited
        </span>
      )}
    </div>
  );
}

export function StatusIndicatorPill({ status }: { status: 'Normal' | 'Warning' | 'Critical' }) {
  const styles = {
    Normal: 'bg-emerald-100 text-emerald-800',
    Warning: 'bg-amber-100 text-amber-800',
    Critical: 'bg-red-100 text-red-800 animate-pulse',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function TrendPill({ trend, value }: { trend: 'up' | 'down' | 'stable'; value?: string }) {
  const styles = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    stable: 'text-slate-500',
  };
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  return (
    <span className={`text-[8px] font-bold ${styles[trend]}`}>
      {arrow} {value ?? trend}
    </span>
  );
}

export const CHART_COLORS = {
  navy: '#0F172A',
  cobalt: '#2563EB',
  steel: '#64748B',
  teal: '#0D9488',
  emerald: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
};

export const inputClass =
  'w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1.5 text-[10px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100';

export function ModalOverlay({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal aria-labelledby="reports-modal-title">
      <div className={`rounded-lg border border-[#E2E8F0] bg-white shadow-xl ${wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
          <h2 id="reports-modal-title" className="text-sm font-bold text-[#0F172A]">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
