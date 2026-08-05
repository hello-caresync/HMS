export const v0Ui = {
  page: 'mx-auto w-full max-w-6xl space-y-6',
  pageTitle: 'text-2xl font-black text-patient-plum',
  pageSubtitle: 'text-sm font-medium text-patient-lavender',
  card: 'rounded-2xl border border-patient-lavender/30 bg-white p-6 shadow-sm',
  cardHover: 'rounded-2xl border border-patient-lavender/30 bg-white p-6 shadow-sm transition hover:shadow-md',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-patient-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-patient-plum disabled:opacity-60',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-patient-lavender/30 bg-white px-4 py-2.5 text-sm font-bold text-patient-primary transition hover:bg-patient-lavender/10',
  btnDanger:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100',
  input:
    'w-full rounded-xl border border-patient-lavender/30 bg-white px-4 py-2.5 text-sm font-medium text-patient-charcoal focus:border-patient-primary focus:outline-none focus:ring-2 focus:ring-[#572E54]/20',
  select:
    'w-full rounded-xl border border-patient-lavender/30 bg-white px-4 py-2.5 text-sm font-medium focus:border-patient-primary focus:outline-none focus:ring-2 focus:ring-[#572E54]/20',
  badge: 'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
  empty: 'rounded-xl border border-dashed border-patient-lavender/40 bg-patient-lavender/5 p-8 text-center',
} as const;

export const statusBadge: Record<string, string> = {
  Requested: 'border-amber-500/30 bg-amber-50 text-amber-800',
  Confirmed: 'border-emerald-500/30 bg-emerald-50 text-emerald-800',
  'Checked-In': 'border-blue-500/30 bg-blue-50 text-blue-800',
  'In Consultation': 'border-purple-500/30 bg-purple-50 text-purple-800',
  Completed: 'border-slate-500/30 bg-slate-100 text-slate-700',
  Cancelled: 'border-rose-500/30 bg-rose-50 text-rose-700',
  'No-Show': 'border-orange-500/30 bg-orange-50 text-orange-800',
  active: 'border-patient-primary/30 bg-patient-card text-patient-primary',
  completed: 'border-slate-500/30 bg-slate-100 text-slate-600',
  ready: 'border-emerald-500/30 bg-emerald-50 text-emerald-800',
  processing: 'border-amber-500/30 bg-amber-50 text-amber-800',
  ordered: 'border-blue-500/30 bg-blue-50 text-blue-800',
};
