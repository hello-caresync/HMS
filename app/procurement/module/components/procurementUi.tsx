'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Lock, Star, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type {
  AiProcurementStatus,
  DeliveryStatus,
  PaymentDueStatus,
  PrLifecycleStatus,
  RequestPriority,
  RfqStatus,
  StageSignOff,
  StockAvailability,
  TenderStatus,
  ThreeWayMatchStatus,
} from '../procurementNav.types';

export function ProcPanel({
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
        critical ? 'border-red-300 ring-1 ring-red-200' : secure ? 'border-sky-300 ring-1 ring-sky-100' : 'border-[#E2E8F0]'
      } ${className}`}
    >
      <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-1.5">
        <div className="flex min-w-0 items-start gap-2">
          {Icon && (
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${critical ? 'bg-red-600' : secure ? 'bg-sky-700' : 'bg-[#0F172A]'}`}>
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

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  const styles: Record<RequestPriority, string> = {
    Emergency: 'bg-red-600 text-white animate-pulse',
    Critical: 'bg-orange-100 text-orange-800',
    Normal: 'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[priority]}`}>{priority}</span>
  );
}

export function PrStatusPill({ status }: { status: PrLifecycleStatus }) {
  const styles: Record<PrLifecycleStatus, string> = {
    Draft: 'bg-slate-100 text-slate-700',
    'Pending Approval': 'bg-amber-100 text-amber-800',
    Approved: 'bg-sky-100 text-sky-800',
    'PO Generated': 'bg-indigo-100 text-indigo-800',
    'Sent to Vendor': 'bg-violet-100 text-violet-800',
    Completed: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function StockPill({ status }: { status: StockAvailability }) {
  const styles: Record<StockAvailability, string> = {
    'In Stock': 'bg-emerald-100 text-emerald-800',
    'Low Stock': 'bg-amber-100 text-amber-800',
    'Out of Stock': 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function ApprovalPill({ status }: { status: StageSignOff }) {
  const styles: Record<StageSignOff, string> = {
    Pending: 'bg-amber-100 text-amber-800',
    Approved: 'bg-emerald-100 text-emerald-800',
    Rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded px-1 py-0.5 text-[7px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function DeliveryPill({ status }: { status: DeliveryStatus }) {
  const styles: Record<DeliveryStatus, string> = {
    'On Track': 'bg-emerald-100 text-emerald-800',
    Pending: 'bg-amber-100 text-amber-800',
    Delayed: 'bg-red-100 text-red-800 animate-pulse',
    Delivered: 'bg-emerald-100 text-emerald-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function PaymentPill({ status }: { status: PaymentDueStatus }) {
  const styles: Record<PaymentDueStatus, string> = {
    Due: 'bg-amber-100 text-amber-800',
    Partial: 'bg-orange-100 text-orange-800',
    Paid: 'bg-emerald-100 text-emerald-800',
    Overdue: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function MatchPill({ status }: { status: ThreeWayMatchStatus }) {
  const styles: Record<ThreeWayMatchStatus, string> = {
    Pending: 'bg-amber-100 text-amber-800',
    Matched: 'bg-sky-100 text-sky-800',
    Variance: 'bg-red-100 text-red-800',
    'Approved for Payment': 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function RfqPill({ status }: { status: RfqStatus }) {
  const styles: Record<RfqStatus, string> = {
    Open: 'bg-sky-100 text-sky-800',
    Evaluating: 'bg-violet-100 text-violet-800',
    Awarded: 'bg-emerald-100 text-emerald-800',
    Closed: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function TenderPill({ status }: { status: TenderStatus }) {
  const styles: Record<TenderStatus, string> = {
    Draft: 'bg-slate-100 text-slate-700',
    Published: 'bg-sky-100 text-sky-800',
    Evaluation: 'bg-violet-100 text-violet-800',
    Awarded: 'bg-emerald-100 text-emerald-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function AiStatusPill({ status }: { status: AiProcurementStatus }) {
  const styles: Record<AiProcurementStatus, string> = {
    'Pending Review': 'bg-amber-100 text-amber-800',
    Accepted: 'bg-emerald-100 text-emerald-800',
    Rejected: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-2.5 w-2.5 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      ))}
      <span className="ml-0.5 text-[8px] font-bold tabular-nums text-slate-600">{rating.toFixed(1)}</span>
    </span>
  );
}

export function BudgetAlertBanner({ utilizationPct }: { utilizationPct: number }) {
  if (utilizationPct < 85) return null;
  return (
    <div className={`mb-2 flex items-center gap-2 rounded-md border-2 px-3 py-1.5 ${utilizationPct >= 95 ? 'border-red-500 bg-red-600 text-white animate-pulse' : 'border-amber-400 bg-amber-50 text-amber-900'}`}>
      <AlertTriangle className="h-4 w-4" />
      <span className="text-[10px] font-bold uppercase tracking-wide">
        Budget Utilization at {utilizationPct}% — {utilizationPct >= 95 ? 'Over Budget Risk' : 'Approaching Cap'}
      </span>
    </div>
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

export function SecureVendorPlaceholder({ verified }: { verified?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#E2E8F0] bg-slate-50 px-2 py-1.5">
      <div className="flex items-center gap-2">
        <Lock className="h-3 w-3 text-slate-400" />
        <span className="text-[9px] italic text-slate-500">[Vendor Document Verified/Masked for Security]</span>
      </div>
      {verified ? <VerifiedPill /> : <span className="text-[8px] text-amber-600">Pending</span>}
    </div>
  );
}

export function ModalOverlay({ title, onClose, children, wide, critical }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; critical?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4" role="dialog" aria-modal>
      <div className={`w-full rounded-lg border bg-white shadow-xl ${wide ? 'max-w-lg' : 'max-w-md'} ${critical ? 'border-red-400 ring-2 ring-red-200' : 'border-[#E2E8F0]'}`}>
        <div className={`flex items-center justify-between border-b px-4 py-2.5 ${critical ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}>
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
