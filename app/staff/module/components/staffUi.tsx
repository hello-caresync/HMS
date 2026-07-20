'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Lock, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type { EmployeeStatus } from '../staffNav.types';

export function StaffPanel({
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
    <section className={`rounded-md border border-[#E2E8F0] bg-white shadow-sm ${className}`}>
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

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: 'bg-sky-100 text-sky-800',
    'On Duty': 'bg-emerald-100 text-emerald-800',
    'Off Duty': 'bg-slate-100 text-slate-600',
    'On Leave': 'bg-amber-100 text-amber-800',
    Pending: 'bg-amber-100 text-amber-800',
    Approved: 'bg-emerald-100 text-emerald-800',
    Rejected: 'bg-red-100 text-red-800',
    Processed: 'bg-emerald-100 text-emerald-800',
    Generated: 'bg-sky-100 text-sky-800',
    Sent: 'bg-emerald-100 text-emerald-800',
    Failed: 'bg-red-100 text-red-800',
    'On Hold': 'bg-amber-100 text-amber-800',
    Complete: 'bg-emerald-100 text-emerald-800',
    Due: 'bg-amber-100 text-amber-800',
    Overdue: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
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

export function SecureDocPlaceholder({ label, verified }: { label: string; verified?: boolean }) {
  return (
    <div className="rounded-md border border-[#E2E8F0] bg-slate-50 px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-slate-400" />
          <div>
            <p className="text-[10px] font-semibold text-[#0F172A]">{label}</p>
            <p className="text-[9px] italic text-slate-500">[Identity Verification Checked/Masked for Security]</p>
          </div>
        </div>
        {verified ? <VerifiedPill /> : <span className="text-[9px] text-amber-600">Pending</span>}
      </div>
    </div>
  );
}

export function ModalOverlay({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4" role="dialog" aria-modal>
      <div className={`w-full rounded-lg border border-[#E2E8F0] bg-white shadow-xl ${wide ? 'max-w-lg' : 'max-w-md'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <h2 className="text-sm font-bold text-[#0F172A]">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function DrawerOverlay({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/40" role="dialog" aria-modal>
      <button type="button" className="flex-1" onClick={onClose} aria-label="Close backdrop" />
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-[#E2E8F0] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">{title}</h2>
            {subtitle && <p className="text-[10px] text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export const inputClass =
  'w-full rounded-md border border-[#E2E8F0] px-2.5 py-1.5 text-[11px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100';

export function employeeStatusColor(status: EmployeeStatus): string {
  const map: Record<EmployeeStatus, string> = {
    Active: 'text-sky-700',
    'On Duty': 'text-emerald-700',
    'Off Duty': 'text-slate-500',
    'On Leave': 'text-amber-700',
  };
  return map[status];
}
