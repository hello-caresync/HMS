'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Lock, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type { BedStatus, RequestStatus } from '../admissionsNav.types';

export function AdmPanel({
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
    Pending: 'bg-amber-100 text-amber-800',
    Approved: 'bg-emerald-100 text-emerald-800',
    'In Progress': 'bg-indigo-100 text-indigo-800',
    Rejected: 'bg-red-100 text-red-800',
    'Active IPD': 'bg-indigo-100 text-indigo-800',
    ICU: 'bg-red-100 text-red-800',
    'Emergency Hold': 'bg-red-50 text-red-700 ring-1 ring-red-200',
    Complete: 'bg-emerald-100 text-emerald-800',
    Blocked: 'bg-red-100 text-red-800',
    Occupied: 'bg-indigo-100 text-indigo-800',
    Available: 'bg-emerald-100 text-emerald-800',
    Reserved: 'bg-amber-100 text-amber-800',
    Cleaning: 'bg-slate-100 text-slate-600',
    'Pending Approval': 'bg-amber-100 text-amber-800',
    Completed: 'bg-emerald-100 text-emerald-800',
    'Pre-Auth Approved': 'bg-emerald-100 text-emerald-800',
    Denied: 'bg-red-100 text-red-800',
    'Self Pay': 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    Emergency: 'bg-red-100 text-red-800',
    Urgent: 'bg-amber-100 text-amber-800',
    Elective: 'bg-sky-100 text-sky-800',
    Referral: 'bg-violet-100 text-violet-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[priority] ?? 'bg-slate-100'}`}>
      {priority}
    </span>
  );
}

export function BedStatusBadge({ status }: { status: BedStatus }) {
  return <StatusPill status={status} />;
}

export function VerifiedPill({ label = 'Verified' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />
      {label}
    </span>
  );
}

export function SecureIdentityPlaceholder({ verified }: { verified?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#E2E8F0] bg-slate-50 px-2 py-1.5">
      <div className="flex items-center gap-2">
        <Lock className="h-3 w-3 text-slate-400" />
        <span className="text-[9px] italic text-slate-500">[Identity Verification Checked/Masked for Security]</span>
      </div>
      {verified ? <VerifiedPill /> : <span className="text-[8px] text-amber-600">Pending</span>}
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

export const inputClass =
  'w-full rounded-md border border-[#E2E8F0] px-2.5 py-1.5 text-[11px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100';

export function RequestStatusPill({ status }: { status: RequestStatus }) {
  return <StatusPill status={status} />;
}
