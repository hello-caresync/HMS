'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Lock, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type {
  BarcodeStatus,
  BatchAvailability,
  ControlledApprovalStage,
  GrnStatus,
  PrescriptionPriority,
  PrescriptionSource,
  PrescriptionStatus,
  QueueTokenStatus,
} from '../pharmacyNav.types';

export function PharmPanel({
  title,
  subtitle,
  icon: Icon,
  children,
  headerRight,
  className = '',
  critical,
  secure,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  critical?: boolean;
  secure?: boolean;
}) {
  return (
    <section
      className={`rounded-md border bg-white shadow-sm ${
        critical ? 'border-red-300 ring-1 ring-red-200' : secure ? 'border-violet-300 ring-1 ring-violet-100' : 'border-[#E2E8F0]'
      } ${className}`}
    >
      <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-1.5">
        <div className="flex min-w-0 items-start gap-2">
          {Icon && (
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                critical ? 'bg-red-600' : secure ? 'bg-violet-700' : 'bg-[#0F172A]'
              }`}
            >
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

export function SourcePill({ source }: { source: PrescriptionSource }) {
  const styles: Record<PrescriptionSource, string> = {
    OPD: 'bg-sky-100 text-sky-800',
    IPD: 'bg-indigo-100 text-indigo-800',
    Emergency: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[source]}`}>{source}</span>
  );
}

export function PriorityBadge({ priority }: { priority: PrescriptionPriority }) {
  const styles: Record<PrescriptionPriority, string> = {
    Routine: 'bg-slate-100 text-slate-700',
    STAT: 'bg-red-600 text-white animate-pulse',
    Controlled: 'bg-violet-700 text-white ring-1 ring-violet-400',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[priority]}`}>{priority}</span>
  );
}

export function RxStatusPill({ status }: { status: PrescriptionStatus }) {
  const styles: Record<PrescriptionStatus, string> = {
    'Pending Verification': 'bg-amber-100 text-amber-800',
    Verified: 'bg-sky-100 text-sky-800',
    Processing: 'bg-violet-100 text-violet-800',
    'Ready to Dispense': 'bg-indigo-100 text-indigo-800',
    Dispensed: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function BatchPill({ status }: { status: BatchAvailability }) {
  const styles: Record<BatchAvailability, string> = {
    Available: 'bg-emerald-100 text-emerald-800',
    'Low Stock': 'bg-amber-100 text-amber-800',
    'Out of Stock': 'bg-red-100 text-red-800 animate-pulse',
    'Substitute Required': 'bg-orange-100 text-orange-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function BarcodePill({ status }: { status: BarcodeStatus }) {
  const styles: Record<BarcodeStatus, string> = {
    Pending: 'bg-amber-100 text-amber-800',
    Printed: 'bg-sky-100 text-sky-800',
    Scanned: 'bg-emerald-100 text-emerald-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function QueuePill({ status }: { status: QueueTokenStatus }) {
  const styles: Record<QueueTokenStatus, string> = {
    Waiting: 'bg-amber-100 text-amber-800',
    Called: 'bg-sky-100 text-sky-800',
    'At Counter': 'bg-violet-100 text-violet-800',
    Completed: 'bg-emerald-100 text-emerald-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function GrnPill({ status }: { status: GrnStatus }) {
  const styles: Record<GrnStatus, string> = {
    'Pending QC': 'bg-amber-100 text-amber-800',
    Verified: 'bg-emerald-100 text-emerald-800',
    Rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function ControlledStagePill({ stage }: { stage: ControlledApprovalStage }) {
  const styles: Record<ControlledApprovalStage, string> = {
    'Pending Chief Pharmacist': 'bg-amber-100 text-amber-800',
    Approved: 'bg-violet-100 text-violet-800',
    Dispensed: 'bg-emerald-100 text-emerald-800',
    'Audit Logged': 'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[stage]}`}>{stage}</span>
  );
}

export function ControlledAlertBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="mb-2 flex items-center gap-2 rounded-md border-2 border-violet-600 bg-violet-700 px-3 py-1.5 text-white">
      <AlertTriangle className="h-4 w-4 animate-pulse" />
      <span className="text-[10px] font-bold uppercase tracking-wide">
        {count} Controlled Drug Alert{count !== 1 ? 's' : ''} — Chief Pharmacist Authorization Required
      </span>
    </div>
  );
}

export function OutOfStockBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="mb-2 flex items-center gap-2 rounded-md border-2 border-red-500 bg-red-600 px-3 py-1.5 text-white animate-pulse">
      <AlertTriangle className="h-4 w-4" />
      <span className="text-[10px] font-bold uppercase tracking-wide">
        {count} Out-of-Stock Item{count !== 1 ? 's' : ''} — Purchase Request Recommended
      </span>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Paid: 'bg-emerald-100 text-emerald-800',
    Partial: 'bg-amber-100 text-amber-800',
    Outstanding: 'bg-red-100 text-red-800',
    'Insurance Pending': 'bg-indigo-100 text-indigo-800',
    Draft: 'bg-slate-100 text-slate-600',
    Submitted: 'bg-sky-100 text-sky-800',
    Approved: 'bg-emerald-100 text-emerald-800',
    'PO Issued': 'bg-violet-100 text-violet-800',
    'Schedule H': 'bg-amber-100 text-amber-800',
    'Schedule H1': 'bg-orange-100 text-orange-800',
    'Schedule X': 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

export function VerifiedPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[8px] font-bold uppercase text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />
      Verified
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
  critical,
  secure,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  critical?: boolean;
  secure?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4" role="dialog" aria-modal>
      <div
        className={`w-full rounded-lg border bg-white shadow-xl ${wide ? 'max-w-lg' : 'max-w-md'} ${
          critical ? 'border-red-400 ring-2 ring-red-200' : secure ? 'border-violet-400 ring-2 ring-violet-200' : 'border-[#E2E8F0]'
        }`}
      >
        <div
          className={`flex items-center justify-between border-b px-4 py-2.5 ${
            critical ? 'border-red-200 bg-red-50' : secure ? 'border-violet-200 bg-violet-50' : 'border-slate-100'
          }`}
        >
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
