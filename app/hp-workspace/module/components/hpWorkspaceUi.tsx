'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Lock, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type {
  ApprovalStatus,
  ApprovalType,
  HpRolePersona,
  TaskPriority,
  TaskStatus,
} from '../hpWorkspaceNav.types';

const badgeBase = 'inline-flex items-center rounded-md px-3 py-1 text-sm font-semibold uppercase tracking-wide';

export function HpPanel({
  title,
  subtitle,
  icon: Icon,
  children,
  headerRight,
  className = '',
  accent,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  accent?: 'blue' | 'purple' | 'amber';
}) {
  const accentBorder = accent === 'purple' ? 'border-violet-200' : accent === 'amber' ? 'border-amber-200' : 'border-[#E2E8F0]';
  return (
    <section className={`rounded-lg border bg-white shadow-sm ${accentBorder} ${className}`}>
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#0F172A]">
              <Icon className="h-4 w-4 text-white" strokeWidth={2} />
            </span>
          )}
          <div>
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
        </div>
        {headerRight}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function SecureIdentityPlaceholder({ verified }: { verified?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-indigo-100 bg-indigo-50/60 px-3 py-2">
      <Lock className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
      <span className="text-sm italic text-indigo-700">[Identity Identification Document Masked for Security]</span>
      {verified && (
        <span className={`${badgeBase} ml-auto bg-emerald-100 text-emerald-800`}>
          <CheckCircle2 className="mr-1 h-4 w-4" />
          Verified
        </span>
      )}
    </div>
  );
}

export function PriorityPill({ priority }: { priority: TaskPriority }) {
  const styles: Record<TaskPriority, string> = {
    Emergency: 'bg-red-100 text-red-800 animate-pulse ring-1 ring-red-300',
    High: 'bg-amber-100 text-amber-800',
    Normal: 'bg-slate-100 text-slate-700',
  };
  return <span className={`${badgeBase} ${styles[priority]}`}>{priority}</span>;
}

export function TaskStatusPill({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    Pending: 'bg-amber-100 text-amber-800',
    'In Progress': 'bg-sky-100 text-sky-800',
    Verified: 'bg-violet-100 text-violet-800',
    Completed: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  };
  return <span className={`${badgeBase} ${styles[status]}`}>{status}</span>;
}

export function RoleBadge({ role }: { role: HpRolePersona }) {
  const styles: Record<HpRolePersona, string> = {
    Admin: 'bg-[#0F172A] text-white',
    Doctor: 'bg-sky-100 text-sky-800',
    Nurse: 'bg-emerald-100 text-emerald-800',
    Staff: 'bg-slate-100 text-slate-700',
    Finance: 'bg-violet-100 text-violet-800',
    Procurement: 'bg-orange-100 text-orange-800',
  };
  return <span className={`${badgeBase} ${styles[role]}`}>{role}</span>;
}

export function ApprovalTypePill({ type }: { type: ApprovalType }) {
  const styles: Record<ApprovalType, string> = {
    'Purchase Approval': 'bg-orange-100 text-orange-800',
    'Leave Request': 'bg-sky-100 text-sky-800',
    'Discount Adjustment': 'bg-violet-100 text-violet-800',
    'Insurance Pre-Auth': 'bg-indigo-100 text-indigo-800',
  };
  return <span className={`${badgeBase} ${styles[type]}`}>{type}</span>;
}

export function ApprovalStatusPill({ status }: { status: ApprovalStatus }) {
  const styles: Record<ApprovalStatus, string> = {
    Pending: 'bg-amber-100 text-amber-800',
    'Under Review': 'bg-violet-100 text-violet-800',
    Approved: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
    Rejected: 'bg-red-100 text-red-800',
  };
  return <span className={`${badgeBase} ${styles[status]}`}>{status}</span>;
}

export function AiSeverityPill({ severity }: { severity: 'Info' | 'Warning' | 'Critical' }) {
  const styles = {
    Info: 'bg-sky-100 text-sky-800',
    Warning: 'bg-amber-100 text-amber-800',
    Critical: 'bg-red-100 text-red-800 animate-pulse',
  };
  return <span className={`${badgeBase} ${styles[severity]}`}>{severity}</span>;
}

export function CapacityStatusPill({ status }: { status: 'Normal' | 'High' | 'Critical' }) {
  const styles = {
    Normal: 'bg-emerald-100 text-emerald-800',
    High: 'bg-amber-100 text-amber-800',
    Critical: 'bg-red-100 text-red-800 animate-pulse',
  };
  return <span className={`${badgeBase} ${styles[status]}`}>{status}</span>;
}

export function EquipmentStatusPill({ status }: { status: 'Operational' | 'Scheduled Maintenance' | 'Out of Service' }) {
  const styles = {
    Operational: 'bg-emerald-100 text-emerald-800',
    'Scheduled Maintenance': 'bg-amber-100 text-amber-800',
    'Out of Service': 'bg-red-100 text-red-800',
  };
  return <span className={`${badgeBase} ${styles[status]}`}>{status}</span>;
}

export function AuditResultPill({ result }: { result: 'Success' | 'Denied' | 'Flagged' }) {
  const styles = {
    Success: 'bg-emerald-100 text-emerald-800',
    Denied: 'bg-red-100 text-red-800',
    Flagged: 'bg-amber-100 text-amber-800',
  };
  return <span className={`${badgeBase} ${styles[result]}`}>{result}</span>;
}

export function ActivityCategoryDot({ category }: { category: string }) {
  const colors: Record<string, string> = {
    Clinical: 'bg-sky-500',
    Administrative: 'bg-slate-500',
    Emergency: 'bg-red-500 animate-pulse',
    Finance: 'bg-violet-500',
    Supply: 'bg-orange-500',
  };
  return <span className={`mt-2 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${colors[category] ?? 'bg-slate-400'}`} />;
}

export const inputClass =
  'w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-base text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal aria-labelledby="hp-modal-title">
      <div className={`rounded-lg border border-[#E2E8F0] bg-white shadow-xl ${wide ? 'w-full max-w-lg' : 'w-full max-w-md'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 id="hp-modal-title" className="text-xl font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function DrawerOverlay({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[#E2E8F0] bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-4 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close drawer">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="custom-scrollbar flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
}
