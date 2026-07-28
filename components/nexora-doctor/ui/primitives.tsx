import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ui = {
  page: 'min-h-0 flex-1 overflow-auto p-6 lg:p-8',
  pageTitle: 'text-2xl font-semibold tracking-tight text-slate-900',
  pageSubtitle: 'mt-1 text-sm text-slate-500',
  card: 'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm',
  cardHover: 'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md',
  input:
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20',
  select:
    'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-600 disabled:opacity-50',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50',
  btnDanger:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50',
  badge:
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  table: 'w-full text-left text-sm',
  th: 'border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500',
  td: 'border-b border-slate-50 px-4 py-3.5 text-slate-700',
} as const;

export const statusColors: Record<string, string> = {
  scheduled: 'bg-slate-100 text-slate-700',
  waiting: 'bg-amber-50 text-amber-700',
  'in-progress': 'bg-teal-50 text-teal-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600',
  pending: 'bg-amber-50 text-amber-700',
  draft: 'bg-slate-100 text-slate-600',
};

export const orderTypeLabels: Record<string, string> = {
  lab: 'Laboratory',
  radiology: 'Radiology',
  procedure: 'Procedure',
  admission: 'Admission',
  surgery: 'Surgery',
  prescription: 'Prescription',
};
