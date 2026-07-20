'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Lock, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type {
  AiFinanceInsightStatus,
  ApInvoiceStatus,
  BillPaymentStatus,
  BillingQueueType,
  ClaimStage,
  FraudRiskLevel,
  PaymentMode,
} from '../billingNav.types';

export function FinPanel({
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
    <section className={`rounded-md border bg-white shadow-sm ${critical ? 'border-red-300 ring-1 ring-red-200' : secure ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-[#E2E8F0]'} ${className}`}>
      <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-1.5">
        <div className="flex min-w-0 items-start gap-2">
          {Icon && (
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${critical ? 'bg-red-600' : secure ? 'bg-indigo-700' : 'bg-[#0F172A]'}`}>
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

export function QueueTypePill({ type }: { type: BillingQueueType }) {
  const styles: Record<BillingQueueType, string> = {
    OPD: 'bg-sky-100 text-sky-800',
    IPD: 'bg-indigo-100 text-indigo-800',
    Emergency: 'bg-red-100 text-red-800',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[type]}`}>{type}</span>;
}

export function BillStatusPill({ status }: { status: BillPaymentStatus }) {
  const styles: Record<BillPaymentStatus, string> = {
    Pending: 'bg-amber-100 text-amber-800',
    Partial: 'bg-orange-100 text-orange-800',
    Paid: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
    Disputed: 'bg-red-100 text-red-800 animate-pulse',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function PaymentModePill({ mode }: { mode: PaymentMode }) {
  const styles: Record<PaymentMode, string> = {
    Cash: 'bg-emerald-100 text-emerald-800',
    Card: 'bg-sky-100 text-sky-800',
    UPI: 'bg-violet-100 text-violet-800',
    'Corporate Credit': 'bg-indigo-100 text-indigo-800',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[mode]}`}>{mode}</span>;
}

export function ClaimStagePill({ stage }: { stage: ClaimStage }) {
  const styles: Record<ClaimStage, string> = {
    'Pre-Authorization': 'bg-sky-100 text-sky-800',
    'Claim Submission': 'bg-indigo-100 text-indigo-800',
    'Under Review': 'bg-violet-100 text-violet-800',
    'Denial Management': 'bg-red-100 text-red-800 animate-pulse',
    Settlement: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[stage]}`}>{stage}</span>;
}

export function ApStatusPill({ status }: { status: ApInvoiceStatus }) {
  const styles: Record<ApInvoiceStatus, string> = {
    'Pending Match': 'bg-amber-100 text-amber-800',
    Matched: 'bg-sky-100 text-sky-800',
    Approved: 'bg-violet-100 text-violet-800',
    Paid: 'bg-emerald-100 text-emerald-800',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function AiStatusPill({ status }: { status: AiFinanceInsightStatus }) {
  const styles: Record<AiFinanceInsightStatus, string> = {
    'Pending Review': 'bg-amber-100 text-amber-800',
    Accepted: 'bg-emerald-100 text-emerald-800',
    Rejected: 'bg-slate-100 text-slate-600',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function FraudPill({ level }: { level: FraudRiskLevel }) {
  const styles: Record<FraudRiskLevel, string> = {
    Normal: 'bg-emerald-100 text-emerald-800',
    Review: 'bg-amber-100 text-amber-800',
    Suspicious: 'bg-red-100 text-red-800 animate-pulse',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[level]}`}>{level}</span>;
}

export function VerifiedPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[8px] font-bold uppercase text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />
      Verified
    </span>
  );
}

export function SecureFinancialPlaceholder({ verified }: { verified?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#E2E8F0] bg-slate-50 px-2 py-1.5">
      <div className="flex items-center gap-2">
        <Lock className="h-3 w-3 text-slate-400" />
        <span className="text-[9px] italic text-slate-500">[Financial Identification Document Masked for Security]</span>
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

export function FraudAlertBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="mb-2 flex items-center gap-2 rounded-md border-2 border-red-500 bg-red-600 px-3 py-1.5 text-white animate-pulse">
      <AlertTriangle className="h-4 w-4" />
      <span className="text-[10px] font-bold uppercase">{count} Suspicious Activity Alert{count !== 1 ? 's' : ''} — Finance audit required</span>
    </div>
  );
}
