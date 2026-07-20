'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Lock, ShieldCheck, X } from 'lucide-react';
import type { ReactNode } from 'react';

export const NAVY = '#0F172A';
export const COBALT = '#2563EB';

export function PatientPanel({
  title,
  subtitle,
  icon: Icon,
  children,
  headerRight,
  className = '',
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-slate-200 bg-white shadow-sm ${className}`}>
      <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <div className="flex min-w-0 items-start gap-2">
          {Icon && (
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#0F172A]">
              <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </span>
          )}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#0F172A]">{title}</h3>
            {subtitle && <p className="text-[10px] text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {headerRight}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

export function VerifiedPill({ label = 'Verified' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />
      {label}
    </span>
  );
}

export function SecureMaskedField({
  label,
  verified = false,
  docType = 'Identity Document',
}: {
  label: string;
  verified?: boolean;
  docType?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="text-[10px] italic text-slate-500">
            [{docType} Omitted/Masked for Security]
          </span>
        </div>
        {verified ? (
          <VerifiedPill />
        ) : (
          <span className="shrink-0 text-[9px] font-medium text-amber-600">Pending verification</span>
        )}
      </div>
    </div>
  );
}

export function SecureVerificationRow({
  items,
}: {
  items: { label: string; verified: boolean }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-2"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className={`h-3.5 w-3.5 ${item.verified ? 'text-emerald-600' : 'text-slate-300'}`} />
            <span className="text-[10px] font-semibold text-[#0F172A]">{item.label}</span>
          </div>
          {item.verified ? <VerifiedPill /> : <span className="text-[9px] text-slate-400">Not on file</span>}
        </div>
      ))}
    </div>
  );
}

export function FieldLabel({ children, required, error }: { children: ReactNode; required?: boolean; error?: string }) {
  return (
    <div className="mb-1">
      <label className={`block text-[10px] font-semibold uppercase tracking-wide ${error ? 'text-red-600' : 'text-slate-500'}`}>
        {children}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {error && <p className="mt-0.5 text-[9px] text-red-600">{error}</p>}
    </div>
  );
}

export const inputClass = (hasError?: boolean) =>
  `w-full rounded-md border px-2.5 py-1.5 text-[11px] text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 bg-red-50/50 focus:ring-red-200'
      : 'border-slate-200 bg-white focus:border-[#2563EB] focus:ring-blue-100'
  }`;

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Inpatient: 'bg-violet-100 text-violet-800',
    Outpatient: 'bg-sky-100 text-sky-800',
    Emergency: 'bg-red-100 text-red-800',
    Discharged: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${colors[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

export function ModalOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4" role="dialog" aria-modal aria-labelledby="modal-title">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <h2 id="modal-title" className="text-sm font-bold text-[#0F172A]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
  badge,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
      >
        <span className="text-[11px] font-bold text-[#0F172A]">{title}</span>
        <span className="flex items-center gap-2">
          {badge}
          <span className="text-[10px] text-slate-400">{open ? '▾' : '▸'}</span>
        </span>
      </button>
      {open && <div className="border-t border-slate-100 p-3">{children}</div>}
    </div>
  );
}

export function DrawerOverlay({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/40" role="dialog" aria-modal aria-labelledby="drawer-title">
      <button type="button" className="flex-1" onClick={onClose} aria-label="Close drawer backdrop" />
      <div className="flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 id="drawer-title" className="text-sm font-bold text-[#0F172A]">{title}</h2>
            {subtitle && <p className="text-[10px] text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function AlertStickyBar({
  type,
  message,
}: {
  type: 'allergy' | 'critical' | 'instruction';
  message: string;
}) {
  const styles = {
    allergy: 'border-red-300 bg-red-50 text-red-900',
    critical: 'border-orange-300 bg-orange-50 text-orange-900',
    instruction: 'border-amber-300 bg-amber-50 text-amber-900',
  };
  const labels = { allergy: 'Allergy Alert', critical: 'Critical Condition', instruction: 'Special Instruction' };

  return (
    <div className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-[10px] font-semibold ${styles[type]}`}>
      <span className="rounded bg-white/60 px-1.5 py-px text-[8px] font-bold uppercase">{labels[type]}</span>
      {message}
    </div>
  );
}
