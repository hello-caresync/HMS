'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Lock, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type {
  EquipmentStatus,
  Modality,
  PatientReadiness,
  ReportStage,
  ScanPipelineStatus,
  ScanPriority,
} from '../radiologyNav.types';

export function RadPanel({
  title,
  subtitle,
  icon: Icon,
  children,
  headerRight,
  className = '',
  critical,
  dark,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  critical?: boolean;
  dark?: boolean;
}) {
  return (
    <section
      className={`rounded-md border shadow-sm ${
        dark
          ? 'border-slate-700 bg-[#0F172A] text-slate-200'
          : critical
            ? 'border-red-300 bg-white ring-1 ring-red-200'
            : 'border-[#E2E8F0] bg-white'
      } ${className}`}
    >
      <header className={`flex items-start justify-between gap-2 border-b px-3 py-1.5 ${dark ? 'border-slate-700' : 'border-slate-100'}`}>
        <div className="flex min-w-0 items-start gap-2">
          {Icon && (
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${critical ? 'bg-red-600' : dark ? 'bg-[#2563EB]' : 'bg-[#0F172A]'}`}>
              <Icon className="h-3 w-3 text-white" strokeWidth={2} />
            </span>
          )}
          <div>
            <h3 className={`text-[10px] font-bold uppercase tracking-[0.06em] ${dark ? 'text-slate-100' : 'text-[#0F172A]'}`}>{title}</h3>
            {subtitle && <p className={`text-[9px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>}
          </div>
        </div>
        {headerRight}
      </header>
      <div className="p-2">{children}</div>
    </section>
  );
}

export function PriorityBadge({ priority }: { priority: ScanPriority }) {
  const styles: Record<ScanPriority, string> = {
    Routine: 'bg-slate-100 text-slate-700',
    'STAT Emergency': 'bg-red-600 text-white animate-pulse',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[priority]}`}>{priority}</span>
  );
}

export function ModalityPill({ modality }: { modality: Modality }) {
  const styles: Record<Modality, string> = {
    CT: 'bg-sky-100 text-sky-800',
    MRI: 'bg-violet-100 text-violet-800',
    'X-Ray': 'bg-slate-100 text-slate-700',
    Ultrasound: 'bg-teal-100 text-teal-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[modality]}`}>{modality}</span>
  );
}

export function ScanStatusPill({ status }: { status: ScanPipelineStatus }) {
  const styles: Record<ScanPipelineStatus, string> = {
    Scheduled: 'bg-amber-100 text-amber-800',
    Waiting: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300',
    'Scan In Progress': 'bg-violet-100 text-violet-800 animate-pulse',
    Completed: 'bg-sky-100 text-sky-800',
    'Pending Report': 'bg-orange-100 text-orange-800',
    'Report Released': 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function ReadinessPill({ status }: { status: PatientReadiness }) {
  const styles: Record<PatientReadiness, string> = {
    'Not Ready': 'bg-red-100 text-red-800',
    'Checked In': 'bg-amber-100 text-amber-800',
    Prepared: 'bg-sky-100 text-sky-800',
    'In Scanner': 'bg-violet-100 text-violet-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function ReportStagePill({ stage }: { stage: ReportStage }) {
  const styles: Record<ReportStage, string> = {
    Draft: 'bg-slate-100 text-slate-700',
    'Tech Review': 'bg-amber-100 text-amber-800',
    'Radiologist Verified': 'bg-violet-100 text-violet-800',
    Released: 'bg-emerald-100 text-emerald-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[stage]}`}>{stage}</span>
  );
}

export function EquipmentPill({ status }: { status: EquipmentStatus }) {
  const styles: Record<EquipmentStatus, string> = {
    Online: 'bg-emerald-100 text-emerald-800',
    Maintenance: 'bg-red-100 text-red-800',
    Offline: 'bg-slate-100 text-slate-600',
    Calibrating: 'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${styles[status]}`}>{status}</span>
  );
}

export function CriticalFindingBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="mb-2 flex items-center gap-2 rounded-md border-2 border-red-500 bg-red-600 px-3 py-1.5 text-white animate-pulse">
      <AlertTriangle className="h-4 w-4" />
      <span className="text-[10px] font-bold uppercase tracking-wide">
        {count} Critical Finding{count !== 1 ? 's' : ''} Requiring Immediate Attention
      </span>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Cleared: 'bg-emerald-100 text-emerald-800',
    Pending: 'bg-amber-100 text-amber-800',
    'Positive — Contraindicated': 'bg-red-100 text-red-800',
    'No Known Allergy': 'bg-emerald-100 text-emerald-800',
    Premedicated: 'bg-sky-100 text-sky-800',
    'Allergy Documented': 'bg-red-100 text-red-800',
    'NPO Verified': 'bg-emerald-100 text-emerald-800',
    'Not Required': 'bg-slate-100 text-slate-600',
    'Pending Verification': 'bg-amber-100 text-amber-800',
    Due: 'bg-red-100 text-red-800',
    Scheduled: 'bg-sky-100 text-sky-800',
    Completed: 'bg-emerald-100 text-emerald-800',
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
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  critical?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4" role="dialog" aria-modal>
      <div
        className={`w-full rounded-lg border bg-white shadow-xl ${wide ? 'max-w-lg' : 'max-w-md'} ${critical ? 'border-red-400 ring-2 ring-red-200' : 'border-[#E2E8F0]'}`}
      >
        <div className={`flex items-center justify-between border-b px-4 py-2.5 ${critical ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}>
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
