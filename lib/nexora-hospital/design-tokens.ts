/** Nexora Hospital Operations Hub — Teal & Cyan palette */

export const HOSPITAL_COLORS = {
  sidebar: '#004D56',
  activePill: '#007B8A',
  hover: '#00A896',
  accent: '#00C49F',
  accentSoft: '#80E0D0',
  cardBg: '#FAFDFF',
  cardBorder: '#B2EBF2',
  textPrimary: '#0A2E36',
  textSecondary: '#005F6B',
  textMuted: '#4A6B72',
  pageBg: '#F0F8F9',
  white: '#FFFFFF',
} as const;

/** Nexora Hospital App V0 — typography & layout tokens */

export const hospitalUi = {
  shell: 'min-h-screen bg-[#F0F8F9] text-[#0A2E36]',
  shellBg: { backgroundColor: HOSPITAL_COLORS.pageBg },
  sidebar:
    'fixed left-0 top-0 z-30 flex h-screen w-64 flex-col justify-between bg-[#004D56] text-white shadow-lg',
  sidebarBrand: 'border-b border-white/10 px-5 py-5',
  sidebarBrandTitle: 'text-xl font-extrabold tracking-tight text-white',
  sidebarBrandSub: 'text-sm font-medium text-[#80E0D0]',
  navItem:
    'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-medium text-[#80E0D0] transition hover:bg-[#00A896]/30',
  navItemActive: 'font-bold text-white shadow-sm',
  navItemActiveBg: { backgroundColor: HOSPITAL_COLORS.activePill },
  mainColumn: 'flex min-h-screen flex-col pl-0 lg:pl-64',
  mainScroll: 'flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8',
  mainScrollBg: { backgroundColor: HOSPITAL_COLORS.pageBg },
  topbar:
    'sticky top-0 z-20 flex min-h-[4.5rem] flex-wrap items-center gap-3 border-b border-[#B2EBF2] bg-white/95 px-4 py-3 backdrop-blur sm:px-6',
  pageInner: 'mx-auto w-full max-w-[1680px]',
  pageTitle: 'text-3xl font-extrabold tracking-tight text-[#0A2E36] sm:text-4xl',
  pageSubtitle: 'mt-1 text-base font-medium text-[#005F6B]',
  sectionTitle: 'text-xl font-bold text-[#0A2E36] sm:text-2xl',
  card: 'rounded-2xl border border-[#B2EBF2] bg-[#FAFDFF] p-5 shadow-sm',
  cardMetric: 'rounded-2xl border border-[#B2EBF2] bg-[#FAFDFF] p-5 shadow-sm',
  cardMetricStyle: {
    backgroundColor: HOSPITAL_COLORS.cardBg,
    borderColor: HOSPITAL_COLORS.cardBorder,
  },
  input:
    'w-full rounded-xl border border-[#007B8A]/30 bg-white px-4 py-3 text-base font-medium text-[#0A2E36] placeholder:text-[#4A6B72]/60 focus:border-[#007B8A] focus:outline-none focus:ring-2 focus:ring-[#B2EBF2]',
  select:
    'w-full rounded-xl border border-[#007B8A]/30 bg-white px-4 py-3 text-base font-medium text-[#0A2E36] focus:border-[#007B8A] focus:outline-none focus:ring-2 focus:ring-[#B2EBF2]',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-[#007B8A] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#004D56] disabled:opacity-50',
  btnPrimaryBg: { backgroundColor: HOSPITAL_COLORS.activePill },
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-[#007B8A] bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#007B8A] transition hover:bg-[#E0F7FA] disabled:opacity-50',
  btnDanger:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-red-700 disabled:opacity-50',
  btnAction:
    'inline-flex items-center justify-center rounded-lg bg-[#007B8A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#005F6B]',
  badge:
    'inline-flex items-center rounded-full px-2.5 py-1 text-sm font-bold uppercase tracking-wider',
  table: 'w-full min-w-[720px] border-collapse text-left text-base',
  th: 'border-b border-[#B2EBF2] px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#005F6B]',
  td: 'border-b border-[#B2EBF2]/60 px-4 py-4 font-medium text-[#0A2E36]',
  link: 'text-sm font-bold text-[#007B8A] hover:text-[#004D56] hover:underline',
  drawer:
    'fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-[#B2EBF2] bg-white shadow-2xl',
  overlay: 'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm',
  tabActive: 'rounded-xl bg-[#007B8A] px-4 py-2.5 text-sm font-bold text-white shadow-sm',
  tabInactive:
    'rounded-xl bg-[#E0F7FA] px-4 py-2.5 text-sm font-bold text-[#005F6B] transition hover:bg-[#007B8A]/20',
  label: 'text-sm font-bold text-[#0A2E36]',
} as const;

export const hospitalStatusColors: Record<string, string> = {
  Active: 'bg-[#80E0D0]/50 text-[#0A2E36]',
  Admitted: 'bg-[#00C49F]/30 text-[#0A2E36]',
  Discharged: 'bg-slate-100 text-slate-700',
  Pending: 'bg-amber-100 text-amber-900',
  Confirmed: 'bg-[#80E0D0]/60 text-[#0A2E36]',
  Cancelled: 'bg-red-100 text-red-800',
  Completed: 'bg-[#E0F7FA] text-[#0A2E36]',
  Waiting: 'bg-amber-100 text-amber-900',
  'Checked-In': 'bg-[#80E0D0]/50 text-[#0A2E36]',
  'In Consultation': 'bg-[#00C49F]/30 text-[#0A2E36]',
  Unpaid: 'bg-red-100 text-red-800',
  Paid: 'bg-[#80E0D0]/60 text-[#0A2E36]',
  Partial: 'bg-amber-100 text-amber-900',
  'In Stock': 'bg-[#80E0D0]/60 text-[#0A2E36]',
  'Low Stock': 'bg-amber-100 text-amber-900',
  'Out of Stock': 'bg-red-100 text-red-800',
  Issued: 'bg-[#E0F7FA] text-[#0A2E36]',
  Accepted: 'bg-[#80E0D0]/60 text-[#0A2E36]',
  Delivered: 'bg-[#80E0D0]/60 text-[#0A2E36]',
  info: 'bg-[#E0F7FA] text-[#0A2E36]',
  warning: 'bg-amber-100 text-amber-900',
  critical: 'bg-red-100 text-red-800',
};
