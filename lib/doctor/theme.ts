/** Nexora Doctor App — design tokens (Deep Navy & Mint Emerald) */

export const clinicalTheme = {
  navy: '#0F172A',
  navySoft: '#1E293B',
  mint: '#0D9488',
  mintBright: '#10B981',
  critical: '#EF4444',
  warning: '#F59E0B',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
} as const;

export const clinicalClasses = {
  pageBg: 'bg-[#F8FAFC] text-[#0F172A]',
  card: 'rounded-xl border border-slate-200/80 bg-white shadow-sm',
  headerTitle: 'text-2xl font-bold tracking-tight text-[#0F172A]',
  headerSubtitle: 'text-sm text-[#64748B]',
  sectionTitle: 'text-sm font-semibold uppercase tracking-wide text-[#64748B]',
  btnPrimary:
    'rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10B981] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]/50',
  btnSecondary:
    'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0D9488]/40',
  btnCritical:
    'rounded-lg bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-red-400/50',
  navActive: 'border-l-4 border-[#0D9488] bg-[#0D9488]/10 font-semibold text-[#0F172A]',
  sidebarBrand: 'bg-[#0F172A] text-white',
} as const;
