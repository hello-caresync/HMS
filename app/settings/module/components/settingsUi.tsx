'use client';

import type { LucideIcon } from 'lucide-react';
import { Lock, ShieldCheck, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type { SettingsStatus } from '../settingsNav.types';

/** Accessible typography scale for Settings workspace canvas */
export const settingsType = {
  canvasTitle: 'text-3xl font-bold text-[#0F172A]',
  canvasSubtitle: 'text-base text-slate-500',
  cardTitle: 'text-xl font-semibold text-[#0F172A]',
  cardSubtitle: 'text-base text-slate-500',
  sectionTitle: 'text-xl font-semibold text-[#0F172A]',
  metricValue: 'text-lg font-bold tabular-nums',
  metricLabel: 'text-base font-semibold text-slate-500',
  tableHead: 'px-3 py-2.5 text-left text-lg font-semibold text-slate-600',
  tableCell: 'px-3 py-2.5 text-base text-[#0F172A]',
  tableCellMuted: 'px-3 py-2.5 text-base text-slate-500',
  body: 'text-base text-[#0F172A]',
  bodyMuted: 'text-base text-slate-500',
  label: 'text-base font-medium text-slate-600',
  badge: 'text-sm font-bold uppercase tracking-wide',
  tabLabel: 'text-base font-bold leading-snug',
  tabDescription: 'text-base leading-snug',
  button: 'text-base font-semibold',
  input: 'text-base text-[#0F172A]',
} as const;

export function SettingsPanel({
  title,
  subtitle,
  icon: Icon,
  children,
  headerRight,
  className = '',
  secure,
  alert,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  secure?: boolean;
  alert?: boolean;
}) {
  return (
    <section className={`rounded-lg border bg-white shadow-sm ${alert ? 'border-red-300 ring-1 ring-red-200' : secure ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-[#E2E8F0]'} ${className}`}>
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${alert ? 'bg-red-600' : secure ? 'bg-indigo-700' : 'bg-[#0F172A]'}`}>
              <Icon className="h-4 w-4 text-white" strokeWidth={2} />
            </span>
          )}
          <div>
            <h3 className={settingsType.cardTitle}>{title}</h3>
            {subtitle && <p className={`mt-0.5 ${settingsType.cardSubtitle}`}>{subtitle}</p>}
          </div>
        </div>
        {headerRight}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function SecureParameterBlock({ verified, label }: { verified?: boolean; label?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-indigo-100 bg-indigo-50/60 px-3 py-2">
      <Lock className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
      <span className="text-base italic text-indigo-700">{label ?? '[System Parameter Block Masked for Enterprise Security]'}</span>
      {verified && (
        <span className={`ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 ${settingsType.badge} text-emerald-800`}>
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure Token
        </span>
      )}
    </div>
  );
}

export function SettingsStatusPill({ status }: { status: SettingsStatus }) {
  const styles: Record<SettingsStatus, string> = {
    Active: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
    Operational: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
    Healthy: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
    Interfaced: 'bg-violet-100 text-violet-800',
    'FHIR Synced': 'bg-violet-100 text-violet-800',
    Pending: 'bg-amber-100 text-amber-800',
    'Security Alert': 'bg-amber-100 text-amber-800 animate-pulse',
    Error: 'bg-red-100 text-red-800',
    'License Expired': 'bg-red-100 text-red-800 animate-pulse ring-1 ring-red-400',
    Disabled: 'bg-slate-100 text-slate-600',
  };
  return <span className={`rounded-md px-2 py-1 ${settingsType.badge} ${styles[status]}`}>{status}</span>;
}

export function LogLevelBadge({ level }: { level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY' }) {
  const styles = {
    INFO: 'bg-slate-100 text-slate-700',
    WARN: 'bg-amber-100 text-amber-800',
    ERROR: 'bg-red-100 text-red-800',
    SECURITY: 'bg-violet-100 text-violet-800',
  };
  return <span className={`rounded-md px-2 py-1 ${settingsType.badge} ${styles[level]}`}>{level}</span>;
}

export const inputClass =
  'w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-base text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100';

export function ModalOverlay({ title, onClose, children, wide, alert }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; alert?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
      <div className={`rounded-xl border bg-white shadow-xl ${wide ? 'w-full max-w-xl' : 'w-full max-w-lg'} ${alert ? 'border-red-300' : 'border-[#E2E8F0]'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-xl font-bold text-[#0F172A]">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function DrawerOverlay({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-[#E2E8F0] bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">{title}</h2>
            {subtitle && <p className={`mt-1 ${settingsType.bodyMuted}`}>{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>
        <div className="custom-scrollbar flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </>
  );
}

export function ToggleSwitch({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${enabled ? 'bg-[#2563EB]' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function KpiMetricCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  tone?: 'default' | 'accent' | 'success' | 'warn' | 'danger' | 'purple';
}) {
  const valueColors = {
    default: 'text-[#0F172A]',
    accent: 'text-[#2563EB]',
    success: 'text-emerald-600',
    warn: 'text-amber-600',
    danger: 'text-red-600',
    purple: 'text-violet-600',
  };
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
      <p className={`${settingsType.metricValue} ${valueColors[tone]}`}>{value}</p>
      <p className={`mt-1 ${settingsType.metricLabel}`}>{label}</p>
    </div>
  );
}
