'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertOctagon, CheckCircle2, Lock, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type { TriageColor, TriagePriority } from '../emergencyNav.types';
import { triageToColor } from '../emergencyNav.types';

export function ErPanel({
  title,
  subtitle,
  icon: Icon,
  children,
  headerRight,
  className = '',
  critical,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  critical?: boolean;
}) {
  return (
    <section
      className={`rounded-md border bg-white shadow-sm ${critical ? 'border-red-300 ring-2 ring-red-200 animate-pulse' : 'border-[#E2E8F0]'} ${className}`}
    >
      <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-1.5">
        <div className="flex min-w-0 items-start gap-2">
          {Icon && (
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${critical ? 'bg-red-600' : 'bg-[#0F172A]'}`}>
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

const TRIAGE_STYLES: Record<TriageColor, string> = {
  red: 'bg-red-600 text-white ring-2 ring-red-400 animate-pulse',
  orange: 'bg-orange-500 text-white',
  yellow: 'bg-yellow-400 text-yellow-900',
  green: 'bg-emerald-500 text-white',
};

export function TriageBadge({ priority, pulse }: { priority: TriagePriority; pulse?: boolean }) {
  const color = triageToColor(priority);
  const labels: Record<TriagePriority, string> = {
    Critical: 'RED — Critical',
    Emergent: 'ORANGE — Emergent',
    Urgent: 'YELLOW — Urgent',
    'Non-Urgent': 'GREEN — Non-Urgent',
  };
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${TRIAGE_STYLES[color]} ${pulse && color === 'red' ? 'animate-pulse' : ''}`}
    >
      {labels[priority]}
    </span>
  );
}

export function CodeBlueBanner({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="mb-2 flex items-center gap-2 rounded-md border-2 border-red-600 bg-red-600 px-3 py-1.5 text-white animate-pulse">
      <AlertOctagon className="h-4 w-4" />
      <span className="text-[10px] font-bold uppercase tracking-wider">Code Blue Active — Resuscitation Bay</span>
    </div>
  );
}

export function MlcFlag({ active }: { active: boolean }) {
  if (!active) return <span className="text-[8px] text-slate-300">—</span>;
  return (
    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">MLC</span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Occupied: 'bg-indigo-100 text-indigo-800',
    Available: 'bg-emerald-100 text-emerald-800',
    Reserved: 'bg-amber-100 text-amber-800',
    Cleaning: 'bg-slate-100 text-slate-600',
    Waiting: 'bg-amber-100 text-amber-800',
    'Under Treatment': 'bg-violet-100 text-violet-800',
    Observation: 'bg-sky-100 text-sky-800',
    Discharged: 'bg-emerald-100 text-emerald-800',
    Ordered: 'bg-amber-100 text-amber-800',
    'Sample Collected': 'bg-sky-100 text-sky-800',
    'In Progress': 'bg-violet-100 text-violet-800',
    'Report Ready': 'bg-emerald-100 text-emerald-800',
    'Not Started': 'bg-slate-100 text-slate-600',
    Completed: 'bg-emerald-100 text-emerald-800',
    Dispatched: 'bg-orange-100 text-orange-800',
    'En Route': 'bg-violet-100 text-violet-800',
    'At Scene': 'bg-red-100 text-red-800',
    Returning: 'bg-sky-100 text-sky-800',
    Maintenance: 'bg-slate-100 text-slate-600',
    Open: 'bg-amber-100 text-amber-800',
    'Police Notified': 'bg-orange-100 text-orange-800',
    'Documentation Complete': 'bg-emerald-100 text-emerald-800',
    Closed: 'bg-slate-100 text-slate-600',
    Pending: 'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

export function TempIdBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[8px] font-bold uppercase text-sky-700">
      Temporary ID Generated
    </span>
  );
}

export function VerifiedPill({ label = 'Verified' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[8px] font-bold uppercase text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />
      {label}
    </span>
  );
}

export function SecureIdentityPlaceholder({ verified, unknown }: { verified?: boolean; unknown?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#E2E8F0] bg-slate-50 px-2 py-1.5">
      <div className="flex items-center gap-2">
        <Lock className="h-3 w-3 text-slate-400" />
        <span className="text-[9px] italic text-slate-500">[Identity Verification Checked/Masked for Security]</span>
      </div>
      {unknown ? <TempIdBadge /> : verified ? <VerifiedPill /> : <span className="text-[8px] text-amber-600">Pending</span>}
    </div>
  );
}

export function ModalOverlay({
  title,
  onClose,
  children,
  wide,
  critical,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  critical?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4" role="dialog" aria-modal>
      <div className={`w-full rounded-lg border bg-white shadow-xl ${wide ? 'max-w-lg' : 'max-w-md'} ${critical ? 'border-red-400 ring-4 ring-red-200' : 'border-[#E2E8F0]'}`}>
        <div className={`flex items-center justify-between border-b px-4 py-2 ${critical ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}>
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
