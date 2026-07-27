/** Nexora Doctor App — Sage & Cream design tokens */

export const clinicalTheme = {
  sage: '#A39E75',
  sageHover: '#8E8963',
  sageSecondary: '#C7C39E',
  sageLight: '#E6E3C5',
  surface: '#F7F6E8',
  bg: '#FAFAF5',
  text: '#2B2A22',
  muted: '#5C5A4E',
  critical: '#EF4444',
  warning: '#F59E0B',
  card: '#FFFFFF',
} as const;

export const clinicalClasses = {
  pageBg: 'bg-brand-bg text-brand-text',
  card: 'rounded-xl border border-brand-light/80 bg-brand-surface shadow-sm',
  headerTitle: 'text-2xl font-bold tracking-tight text-brand-text',
  headerSubtitle: 'text-sm text-brand-text/70',
  sectionTitle: 'text-sm font-semibold uppercase tracking-wide text-brand-text/60',
  btnPrimary:
    'rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
  btnSecondary:
    'rounded-lg border border-brand-light bg-brand-surface px-4 py-2 text-sm font-semibold text-brand-text hover:bg-brand-light/50 focus-visible:ring-2 focus-visible:ring-brand/40',
  btnCritical:
    'rounded-lg bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-red-400/50',
  navActive: 'border-l-4 border-brand bg-brand-light/60 font-semibold text-brand-text',
  sidebarBrand: 'bg-brand-text text-brand-surface',
} as const;
