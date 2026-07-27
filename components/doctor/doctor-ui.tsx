'use client';

import type { ReactNode } from 'react';

import { clinicalClasses } from '@/lib/doctor/theme';

export function ClinicalPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-brand-light/80 pb-4">
      <div>
        <h1 className={clinicalClasses.headerTitle}>{title}</h1>
        {subtitle && <p className={`mt-1 ${clinicalClasses.headerSubtitle}`}>{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function VitalsGrid({
  items,
}: {
  items: { label: string; value: string; unit?: string; critical?: boolean }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((v) => (
        <div
          key={v.label}
          className={`${clinicalClasses.card} p-4 ${v.critical ? 'border-[#EF4444]/40 bg-red-50/30' : ''}`}
        >
          <p className={clinicalClasses.sectionTitle}>{v.label}</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${v.critical ? 'text-[#EF4444]' : 'text-brand'}`}>
            {v.value}
            {v.unit && <span className="ml-1 text-sm font-medium text-brand-text/60">{v.unit}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Compact horizontal vitals strip for sticky EMR header bars. */
export function StickyVitalsBar({
  items,
}: {
  items: { label: string; value: string; unit?: string; critical?: boolean }[];
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-brand-light/60 px-4 py-2.5"
      aria-label="Current vitals"
    >
      {items.map((v) => (
        <div key={v.label} className="flex items-baseline gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-text/60">{v.label}</span>
          <span
            className={`text-sm font-bold tabular-nums ${v.critical ? 'text-[#EF4444]' : 'text-brand-text'}`}
          >
            {v.value}
            {v.unit && <span className="ml-0.5 text-xs font-medium text-brand-text/60">{v.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

export const VitalsCard = VitalsGrid;

export function PatientHeaderBar(props: {
  name: string;
  mrn: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string[];
}) {
  return (
    <header className={`${clinicalClasses.card} p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-brand-text">{props.name}</h2>
          <p className="text-sm text-brand-text/70">
            {props.mrn} · {props.age}y · {props.gender} · {props.bloodGroup}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {props.allergies.length === 0 ? (
            <span className="rounded-full bg-brand-light/80 px-2 py-0.5 text-xs font-semibold text-brand-hover">NKDA</span>
          ) : (
            props.allergies.map((a) => (
              <span
                key={a}
                className="rounded-full border border-[#EF4444]/30 bg-red-50 px-2 py-0.5 text-xs font-semibold text-[#EF4444]"
              >
                Allergy: {a}
              </span>
            ))
          )}
        </div>
      </div>
    </header>
  );
}

export function ICD10SearchCombobox({
  value,
  onChange,
  onSelect,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (code: string, label: string) => void;
  options: { code: string; label: string }[];
}) {
  const filtered = options.filter(
    (o) =>
      o.code.toLowerCase().includes(value.toLowerCase()) ||
      o.label.toLowerCase().includes(value.toLowerCase()),
  );
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search ICD-10 index…"
        className="w-full rounded-lg border border-brand-light px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
      {value && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-brand-light bg-brand-surface shadow-lg">
          {filtered.slice(0, 8).map((o) => (
            <li key={o.code}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-brand-light/40"
                onClick={() => onSelect(o.code, o.label)}
              >
                <span className="font-mono font-semibold text-brand">{o.code}</span> — {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const ICD10SearchInput = ICD10SearchCombobox;

export function PrescriptionTable({
  rows,
  onRemove,
}: {
  rows: { drugName: string; dosage: string; frequency: string; duration: string }[];
  onRemove?: (index: number) => void;
}) {
  return (
    <div className={`${clinicalClasses.card} overflow-x-auto p-2`}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-brand-light/60 text-brand-text/60">
            {['Drug', 'Dose', 'Frequency', 'Duration', ''].map((h) => (
              <th key={h} className="px-2 py-2 text-xs font-semibold uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-brand-light/40">
              <td className="px-2 py-2 font-medium">{r.drugName}</td>
              <td className="px-2 py-2">{r.dosage}</td>
              <td className="px-2 py-2">{r.frequency}</td>
              <td className="px-2 py-2">{r.duration}</td>
              <td className="px-2 py-2">
                {onRemove && (
                  <button type="button" className="text-xs font-semibold text-[#EF4444]" onClick={() => onRemove(i)}>
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PrescriptionItemRow(props: {
  drug: string;
  dosage: string;
  frequency: string;
  onRemove?: () => void;
}) {
  return (
    <div className={`${clinicalClasses.card} flex justify-between px-3 py-2`}>
      <div>
        <p className="font-medium">{props.drug}</p>
        <p className="text-xs text-brand-text/60">
          {props.dosage} · {props.frequency}
        </p>
      </div>
      {props.onRemove && (
        <button type="button" className="text-xs text-[#EF4444]" onClick={props.onRemove}>
          Remove
        </button>
      )}
    </div>
  );
}

export function CriticalAlertBanner({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return (
    <div className="animate-pulse rounded-xl border border-[#EF4444]/30 border-l-4 border-l-[#EF4444] bg-red-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#EF4444]">Critical alert</p>
      <ul className="mt-2 space-y-1 text-sm font-semibold text-brand-text">
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

export function DigitalSignaturePad({ onApply }: { onApply: (token: string) => void }) {
  return (
    <div className="rounded-xl border border-dashed border-brand-secondary bg-brand-bg p-4 text-center">
      <p className="text-sm text-brand-text/70">Digital signature canvas · HIPAA audit logged</p>
      <button type="button" className={`mt-3 ${clinicalClasses.btnPrimary}`} onClick={() => onApply('SIG_VERIFIED_MOCK')}>
        Apply verified signature
      </button>
    </div>
  );
}

export function DoctorModuleShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={clinicalClasses.pageBg}>
      <ClinicalPageHeader title={title} subtitle={subtitle} actions={actions} />
      {children}
    </div>
  );
}
