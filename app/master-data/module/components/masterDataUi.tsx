'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Lock, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type { ApprovalWorkflowStatus, MasterRecordStatus } from '../masterDataNav.types';

export function MdmPanel({
  title,
  subtitle,
  icon: Icon,
  children,
  headerRight,
  className = '',
  secure,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  secure?: boolean;
}) {
  return (
    <section className={`rounded-md border bg-white shadow-sm ${secure ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-[#E2E8F0]'} ${className}`}>
      <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-1.5">
        <div className="flex min-w-0 items-start gap-2">
          {Icon && (
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${secure ? 'bg-indigo-700' : 'bg-[#0F172A]'}`}>
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

export function SecureLicensePlaceholder({ verified }: { verified?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-indigo-100 bg-indigo-50/60 px-2 py-1">
      <Lock className="h-3 w-3 shrink-0 text-indigo-600" aria-hidden />
      <span className="text-[8px] italic text-indigo-700">[Commercial License Verification Checked/Masked for Security]</span>
      {verified && (
        <span className="ml-auto inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[7px] font-bold uppercase text-emerald-800">
          <CheckCircle2 className="h-2.5 w-2.5" />
          Verified
        </span>
      )}
    </div>
  );
}

export function RecordStatusPill({ status }: { status: MasterRecordStatus }) {
  const styles: Record<MasterRecordStatus, string> = {
    Active: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
    Inactive: 'bg-red-100 text-red-800',
    Pending: 'bg-amber-100 text-amber-800',
    Duplicate: 'bg-amber-100 text-amber-800 animate-pulse',
    Mapped: 'bg-violet-100 text-violet-800',
    Synchronized: 'bg-violet-100 text-violet-800 ring-1 ring-violet-300',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function ApprovalStatusPill({ status }: { status: ApprovalWorkflowStatus }) {
  const styles: Record<ApprovalWorkflowStatus, string> = {
    Pending: 'bg-amber-100 text-amber-800',
    'Under Review': 'bg-violet-100 text-violet-800',
    Approved: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
    Rejected: 'bg-red-100 text-red-800',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function OrgLevelPill({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Branch: 'bg-[#0F172A] text-white',
    Building: 'bg-sky-100 text-sky-800',
    Floor: 'bg-teal-100 text-teal-800',
    Block: 'bg-indigo-100 text-indigo-800',
    Department: 'bg-violet-100 text-violet-800',
    Unit: 'bg-slate-100 text-slate-700',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[7px] font-bold uppercase ${colors[level] ?? 'bg-slate-100'}`}>{level}</span>;
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal aria-labelledby="mdm-modal-title">
      <div className={`rounded-lg border border-[#E2E8F0] bg-white shadow-xl ${wide ? 'w-full max-w-lg' : 'w-full max-w-md'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
          <h2 id="mdm-modal-title" className="text-sm font-bold text-[#0F172A]">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
