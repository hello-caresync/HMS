'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Eye, Lock, ShieldCheck, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type { ComplianceStatus, SignOffStatus } from '../emrNav.types';

export function EmrPanel({
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
      <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-1.5">
        <div className="flex min-w-0 items-start gap-2">
          {Icon && (
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#0F172A]">
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

export function ViewOnlyBadge({ compact }: { compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border border-slate-300 bg-slate-100 font-bold uppercase text-slate-600 ${compact ? 'px-1.5 py-0.5 text-[7px]' : 'px-2 py-0.5 text-[8px]'}`}>
      <Eye className="h-3 w-3" />
      View-Only / Audited
    </span>
  );
}

export function AuditedBanner() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#0F172A]/20 bg-[#0F172A] px-3 py-1.5 text-white">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <span className="text-[10px] font-semibold">Read-Only Operational Vault — Medical Records · Administration · Quality Management</span>
      </div>
      <ViewOnlyBadge />
    </div>
  );
}

export function SignOffPill({ status }: { status: SignOffStatus }) {
  const styles: Record<SignOffStatus, string> = {
    Signed: 'bg-emerald-100 text-emerald-800',
    'Pending Sign-off': 'bg-amber-100 text-amber-800',
    'Not Applicable': 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function CompliancePill({ status }: { status: ComplianceStatus }) {
  const styles: Record<ComplianceStatus, string> = {
    Pass: 'bg-emerald-100 text-emerald-800',
    Pending: 'bg-amber-100 text-amber-800',
    Fail: 'bg-red-100 text-red-800',
    Review: 'bg-sky-100 text-sky-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function OutcomePill({ outcome }: { outcome: string }) {
  const styles: Record<string, string> = {
    Success: 'bg-emerald-100 text-emerald-800',
    Denied: 'bg-red-100 text-red-800',
    Flagged: 'bg-amber-100 text-amber-800',
    Active: 'bg-emerald-100 text-emerald-800',
    Revoked: 'bg-red-100 text-red-800',
    Expired: 'bg-slate-100 text-slate-600',
    Access: 'bg-sky-100 text-sky-800',
    Modification: 'bg-violet-100 text-violet-800',
    Consent: 'bg-emerald-100 text-emerald-800',
    Export: 'bg-indigo-100 text-indigo-800',
    'Compliance Check': 'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[outcome] ?? 'bg-slate-100 text-slate-600'}`}>
      {outcome}
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

export function ModalOverlay({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4" role="dialog" aria-modal>
      <div className={`w-full rounded-lg border border-[#E2E8F0] bg-white shadow-xl ${wide ? 'max-w-lg' : 'max-w-md'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#0F172A]">{title}</h2>
            <ViewOnlyBadge compact />
          </div>
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
