'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Lock, Star, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type {
  AiVendorInsightStatus,
  ComplaintStatus,
  FulfillmentStage,
  InvoicePaymentStatus,
  LicenseComplianceStatus,
  OnboardingPhase,
  PoCoordinationStatus,
  SupplyCategory,
} from '../vendorCoordinationNav.types';

export function VrmPanel({
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
    <section className={`rounded-md border bg-white shadow-sm ${critical ? 'border-red-300 ring-1 ring-red-200' : secure ? 'border-teal-300 ring-1 ring-teal-100' : 'border-[#E2E8F0]'} ${className}`}>
      <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-1.5">
        <div className="flex min-w-0 items-start gap-2">
          {Icon && (
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${critical ? 'bg-red-600' : secure ? 'bg-teal-700' : 'bg-[#0F172A]'}`}>
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

export function OnboardingPhasePill({ phase }: { phase: OnboardingPhase }) {
  const styles: Record<OnboardingPhase, string> = {
    Registration: 'bg-slate-100 text-slate-700',
    'Document Verification': 'bg-amber-100 text-amber-800',
    'Quality Team Review': 'bg-violet-100 text-violet-800',
    Activated: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[phase]}`}>{phase}</span>;
}

export function CategoryPill({ category }: { category: SupplyCategory }) {
  const styles: Record<SupplyCategory, string> = {
    Medicines: 'bg-sky-100 text-sky-800',
    'Surgical Items': 'bg-teal-100 text-teal-800',
    Equipment: 'bg-indigo-100 text-indigo-800',
    Implants: 'bg-violet-100 text-violet-800',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[category]}`}>{category}</span>;
}

export function PoCoordPill({ status }: { status: PoCoordinationStatus }) {
  const styles: Record<PoCoordinationStatus, string> = {
    'Awaiting Response': 'bg-amber-100 text-amber-800',
    Confirmed: 'bg-emerald-100 text-emerald-800',
    'Partially Confirmed': 'bg-sky-100 text-sky-800',
    Dispatched: 'bg-violet-100 text-violet-800',
    Delayed: 'bg-red-100 text-red-800 animate-pulse',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function FulfillmentPill({ stage }: { stage: FulfillmentStage }) {
  const styles: Record<FulfillmentStage, string> = {
    'Order Confirmed': 'bg-sky-100 text-sky-800',
    Packed: 'bg-indigo-100 text-indigo-800',
    Dispatched: 'bg-violet-100 text-violet-800',
    'In Transit': 'bg-violet-100 text-violet-800 animate-pulse',
    Delivered: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[stage]}`}>{stage}</span>;
}

export function PaymentPill({ status }: { status: InvoicePaymentStatus }) {
  const styles: Record<InvoicePaymentStatus, string> = {
    'Pending Match': 'bg-amber-100 text-amber-800',
    Approved: 'bg-sky-100 text-sky-800',
    Paid: 'bg-emerald-100 text-emerald-800',
    Overdue: 'bg-red-100 text-red-800 animate-pulse',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function ComplaintPill({ status }: { status: ComplaintStatus }) {
  const styles: Record<ComplaintStatus, string> = {
    Open: 'bg-red-100 text-red-800',
    Investigating: 'bg-amber-100 text-amber-800',
    Resolved: 'bg-emerald-100 text-emerald-800',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function LicensePill({ status }: { status: LicenseComplianceStatus }) {
  const styles: Record<LicenseComplianceStatus, string> = {
    Valid: 'bg-emerald-100 text-emerald-800',
    'Expiring Soon': 'bg-amber-100 text-amber-800',
    Expired: 'bg-red-100 text-red-800 animate-pulse',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function AiStatusPill({ status }: { status: AiVendorInsightStatus }) {
  const styles: Record<AiVendorInsightStatus, string> = {
    'Pending Review': 'bg-amber-100 text-amber-800',
    Accepted: 'bg-emerald-100 text-emerald-800',
    Rejected: 'bg-slate-100 text-slate-600',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-2.5 w-2.5 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      ))}
      <span className="ml-0.5 text-[8px] font-bold tabular-nums">{rating.toFixed(1)}</span>
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

export function SecureSupplierPlaceholder({ verified }: { verified?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#E2E8F0] bg-slate-50 px-2 py-1.5">
      <div className="flex items-center gap-2">
        <Lock className="h-3 w-3 text-slate-400" />
        <span className="text-[9px] italic text-slate-500">[Supplier Documents Verified/Masked for Security]</span>
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

export function VendorDetailDrawer({ vendorName, category, rating, onClose }: { vendorName: string; category: string; rating: number; onClose: () => void }) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-[#E2E8F0] bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-[#0F172A]">Vendor Profile</h2>
        <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close drawer"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-[11px] font-bold text-[#0F172A]">{vendorName}</p>
          <p className="text-[9px] text-slate-500">{category}</p>
          <div className="mt-1"><StarRating rating={rating} /></div>
        </div>
        <SecureSupplierPlaceholder verified />
        <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-[9px] text-slate-600">
          <p className="font-bold uppercase text-slate-500">Commercial Credentials</p>
          <p className="mt-1">GST · PAN · Drug License · MSME · Bank — [Supplier Documents Verified/Masked for Security]</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'On-Time Delivery', value: '94%' },
            { label: 'Quality Score', value: '4.6/5' },
            { label: 'Active POs', value: '5' },
            { label: 'Complaints (YTD)', value: '1' },
          ].map((m) => (
            <div key={m.label} className="rounded border border-[#E2E8F0] p-2">
              <p className="text-sm font-bold text-[#2563EB]">{m.value}</p>
              <p className="text-[7px] font-bold uppercase text-slate-500">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const inputClass =
  'w-full rounded-md border border-[#E2E8F0] px-2.5 py-1.5 text-[11px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100';
