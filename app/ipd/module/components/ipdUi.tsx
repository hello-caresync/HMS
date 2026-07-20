'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Lock, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type { BedAssetStatus, ClinicalStatus, ClearanceStepStatus, MovementStatus, VitalCompliance } from '../ipdNav.types';

export function IpdPanel({
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

export function ClinicalStatusPill({ status }: { status: ClinicalStatus }) {
  const styles: Record<ClinicalStatus, string> = {
    Stable: 'bg-emerald-100 text-emerald-800',
    'Under Review': 'bg-amber-100 text-amber-800',
    Critical: 'bg-red-100 text-red-800',
    ICU: 'bg-red-100 text-red-800 ring-1 ring-red-200',
    'High Risk': 'bg-red-50 text-red-700',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function VitalCompliancePill({ status }: { status: VitalCompliance }) {
  const styles: Record<VitalCompliance, string> = {
    Compliant: 'bg-emerald-100 text-emerald-800',
    'Due Soon': 'bg-amber-100 text-amber-800',
    Overdue: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function BedStatusPill({ status }: { status: BedAssetStatus }) {
  const styles: Record<BedAssetStatus, string> = {
    Occupied: 'bg-indigo-100 text-indigo-800',
    Available: 'bg-emerald-100 text-emerald-800',
    Reserved: 'bg-amber-100 text-amber-800',
    Cleaning: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function MovementStatusPill({ status }: { status: MovementStatus }) {
  const styles: Record<MovementStatus, string> = {
    Scheduled: 'bg-sky-100 text-sky-800',
    'In Transit': 'bg-violet-100 text-violet-800',
    Completed: 'bg-emerald-100 text-emerald-800',
    'Pending Approval': 'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function ClearanceStatusPill({ status }: { status: ClearanceStepStatus }) {
  const styles: Record<ClearanceStepStatus, string> = {
    Cleared: 'bg-emerald-100 text-emerald-800',
    Pending: 'bg-amber-100 text-amber-800',
    'Under Review': 'bg-amber-100 text-amber-800',
    Blocked: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Validated: 'bg-emerald-100 text-emerald-800',
    Pending: 'bg-amber-100 text-amber-800',
    Denied: 'bg-red-100 text-red-800',
    'Self Pay': 'bg-slate-100 text-slate-600',
    Given: 'bg-emerald-100 text-emerald-800',
    Due: 'bg-amber-100 text-amber-800',
    Missed: 'bg-red-100 text-red-800',
    Held: 'bg-slate-100 text-slate-600',
    Active: 'bg-red-100 text-red-800',
    Acknowledged: 'bg-amber-100 text-amber-800',
    Resolved: 'bg-emerald-100 text-emerald-800',
    Served: 'bg-emerald-100 text-emerald-800',
    NPO: 'bg-violet-100 text-violet-800',
    Completed: 'bg-emerald-100 text-emerald-800',
    'In Progress': 'bg-violet-100 text-violet-800',
    High: 'bg-red-100 text-red-800',
    Medium: 'bg-amber-100 text-amber-800',
    Low: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4" role="dialog" aria-modal>
      <div className={`w-full rounded-lg border border-[#E2E8F0] bg-white shadow-xl ${wide ? 'max-w-lg' : 'max-w-md'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <h2 className="text-sm font-bold text-[#0F172A]">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export const inputClass =
  'w-full rounded-md border border-[#E2E8F0] px-2.5 py-1.5 text-[11px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100';
