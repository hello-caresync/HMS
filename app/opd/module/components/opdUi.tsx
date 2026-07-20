'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Lock, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type { PriorityTier, QueueStatus } from '../opdNav.types';

export function OpdPanel({
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

export function QueueStatusPill({ status }: { status: QueueStatus }) {
  const styles: Record<QueueStatus, string> = {
    'Waiting for Consultation': 'bg-amber-100 text-amber-800',
    'Consultation in Progress': 'bg-violet-100 text-violet-800',
    'Consultation Completed': 'bg-emerald-100 text-emerald-800',
    'No-show': 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function PriorityTierBadge({ tier }: { tier: PriorityTier }) {
  const styles: Record<PriorityTier, string> = {
    General: 'bg-slate-100 text-slate-700',
    VIP: 'bg-amber-100 text-amber-800',
    'Emergency Queue': 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[tier]}`}>{tier}</span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Paid: 'bg-emerald-100 text-emerald-800',
    Partial: 'bg-amber-100 text-amber-800',
    Outstanding: 'bg-red-100 text-red-800',
    Waived: 'bg-slate-100 text-slate-600',
    Ordered: 'bg-amber-100 text-amber-800',
    'Sample Collected': 'bg-sky-100 text-sky-800',
    'In Progress': 'bg-violet-100 text-violet-800',
    'Report Ready': 'bg-emerald-100 text-emerald-800',
    Dispatched: 'bg-emerald-100 text-emerald-800',
    Generated: 'bg-sky-100 text-sky-800',
    'Sent to Pharmacy': 'bg-violet-100 text-violet-800',
    'Partially Dispensed': 'bg-amber-100 text-amber-800',
    'Fully Dispensed': 'bg-emerald-100 text-emerald-800',
    Scheduled: 'bg-sky-100 text-sky-800',
    Completed: 'bg-emerald-100 text-emerald-800',
    Pending: 'bg-amber-100 text-amber-800',
    Accepted: 'bg-emerald-100 text-emerald-800',
    Missed: 'bg-red-100 text-red-800',
    Critical: 'bg-red-100 text-red-800',
    Urgent: 'bg-amber-100 text-amber-800',
    Routine: 'bg-slate-100 text-slate-600',
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
