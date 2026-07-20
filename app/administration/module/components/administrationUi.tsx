'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Lock, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type { ApprovalLifecycle, GovernanceStatus, IncidentStatus } from '../administrationNav.types';

export function GovPanel({
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
    <section className={`rounded-md border bg-white shadow-sm ${critical ? 'border-red-300 ring-1 ring-red-200' : secure ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-[#E2E8F0]'} ${className}`}>
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

export function SecureAdminPlaceholder({ verified }: { verified?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-indigo-100 bg-indigo-50/60 px-2 py-1">
      <Lock className="h-3 w-3 shrink-0 text-indigo-600" aria-hidden />
      <span className="text-[8px] italic text-indigo-700">[Administrative License Verification Masked for Privacy Security]</span>
      {verified && (
        <span className="ml-auto inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[7px] font-bold uppercase text-emerald-800">
          <CheckCircle2 className="h-2.5 w-2.5" />
          Verified
        </span>
      )}
    </div>
  );
}

export function GovStatusPill({ status }: { status: GovernanceStatus }) {
  const styles: Record<GovernanceStatus, string> = {
    Active: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
    Approved: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
    Resolved: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
    'In Progress': 'bg-violet-100 text-violet-800',
    Scheduled: 'bg-violet-100 text-violet-800',
    Pending: 'bg-amber-100 text-amber-800',
    Critical: 'bg-red-100 text-red-800 animate-pulse',
    Open: 'bg-red-100 text-red-800',
    Expired: 'bg-red-100 text-red-800 animate-pulse ring-1 ring-red-400',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function ApprovalPill({ status }: { status: ApprovalLifecycle }) {
  const styles: Record<ApprovalLifecycle, string> = {
    Pending: 'bg-amber-100 text-amber-800',
    'Under Review': 'bg-violet-100 text-violet-800',
    Approved: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
    Rejected: 'bg-red-100 text-red-800',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function IncidentPill({ status }: { status: IncidentStatus }) {
  const styles: Record<IncidentStatus, string> = {
    Open: 'bg-red-100 text-red-800 animate-pulse',
    Investigating: 'bg-violet-100 text-violet-800',
    'Root Cause Identified': 'bg-amber-100 text-amber-800',
    Resolved: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>;
}

export function SeverityDot({ severity }: { severity: 'Normal' | 'Warning' | 'Critical' }) {
  const colors = { Normal: 'bg-emerald-500', Warning: 'bg-amber-500', Critical: 'bg-red-500 animate-pulse' };
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${colors[severity]}`} />;
}

export const inputClass =
  'w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1.5 text-[10px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100';

export function ModalOverlay({ title, onClose, children, wide, critical }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; critical?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
      <div className={`rounded-lg border bg-white shadow-xl ${wide ? 'w-full max-w-lg' : 'w-full max-w-md'} ${critical ? 'border-red-300' : 'border-[#E2E8F0]'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
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
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[#E2E8F0] bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">{title}</h2>
            {subtitle && <p className="text-[9px] text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-4 w-4" /></button>
        </header>
        <div className="custom-scrollbar flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
}
