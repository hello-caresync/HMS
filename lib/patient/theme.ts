/** Nexora Patient App — Rose Coral design tokens */
export const patientTheme = {
  primary: '#f47c8c',
  primaryHover: '#e06373',
  primaryLight: '#fde8eb',
  primaryBorder: '#f0d8dc',
  heading: '#8c2b39',
  muted: '#736366',
  body: '#faf6f7',
  emergency: '#e63946',
  white: '#ffffff',
} as const;

export const patientClasses = {
  page: 'min-h-full w-full space-y-6 bg-[#faf6f7] font-sans text-slate-950',
  heading1: 'text-2xl font-black text-[#8c2b39]',
  heading2: 'text-lg font-black text-[#8c2b39]',
  heading3: 'text-base font-black text-[#8c2b39]',
  subtext: 'text-sm font-medium text-[#736366]',
  caption: 'text-xs font-bold text-[#736366]',
  card: 'rounded-2xl border border-[#f0d8dc] bg-white p-6 shadow-sm',
  panel: 'rounded-xl border border-[#f0d8dc] bg-white p-4 shadow-sm',
  iconBadge: 'rounded-lg border border-[#f0d8dc] bg-[#fde8eb] p-2.5 text-[#f47c8c]',
  iconBadgeSm: 'rounded-lg border border-[#f0d8dc] bg-[#fde8eb] p-2 text-[#f47c8c]',
  btnPrimary:
    'rounded-lg bg-[#f47c8c] font-bold text-white transition-colors hover:bg-[#e06373] shadow-sm',
  btnPrimaryLg:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-[#f47c8c] px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#e06373]',
  btnSecondary:
    'rounded-lg border border-[#f47c8c] bg-white font-bold text-[#f47c8c] transition-colors hover:bg-[#fde8eb]',
  badge: 'inline-flex rounded-full border border-[#f0d8dc] bg-[#fde8eb] px-2.5 py-0.5 text-[10px] font-bold text-[#8c2b39]',
  badgeAccent: 'inline-flex rounded-full border border-[#f0d8dc] bg-[#fde8eb] px-2.5 py-0.5 text-[10px] font-bold text-[#f47c8c]',
  notice: 'rounded-xl border border-[#f0d8dc] bg-[#fde8eb] px-4 py-2 text-sm font-bold text-[#f47c8c]',
  accentText: 'font-bold text-[#f47c8c]',
  metricValue: 'text-2xl font-black tabular-nums text-[#8c2b39]',
  emergencyBtn:
    'flex items-center gap-2 rounded-xl bg-[#e63946] px-5 py-2.5 font-extrabold text-white shadow-md transition-all hover:bg-[#d62839]',
  tabActive: 'bg-[#f47c8c] text-white shadow-sm',
  tabInactive:
    'border border-[#f0d8dc] bg-white text-[#736366] hover:bg-[#fde8eb] hover:text-[#8c2b39]',
  appointmentHighlight:
    'rounded-xl border border-[#f0d8dc] bg-gradient-to-r from-[#fde8eb] to-transparent p-5',
  quickActionCard:
    'flex flex-col items-start gap-2 rounded-xl border border-[#f0d8dc] bg-gradient-to-br from-white to-[#faf6f7] p-4 transition-all hover:-translate-y-0.5 hover:border-[#f47c8c]/40',
  checkbox:
    'h-4 w-4 cursor-pointer rounded border-[#f0d8dc] accent-[#f47c8c] text-[#f47c8c] focus:ring-2 focus:ring-[#f47c8c]/30 focus:ring-offset-0',
} as const;
