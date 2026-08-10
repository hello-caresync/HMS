/** Nexora Patient App — executive clinical forest / emerald palette */

export const patientTheme = {
  forest: '#113831',
  emerald: '#227B6B',
  sage: '#EAF5F2',
  border: '#D5E8E3',
  canvas: '#F4F8F7',
  emergency: '#E63950',
  text: '#0E2924',
  muted: '#4B736B',
  /** Legacy aliases → new palette */
  primary: '#113831',
  plum: '#113831',
  card: '#EAF5F2',
  lavender: '#4B736B',
  charcoal: '#0E2924',
  mint: '#EAF5F2',
  ice: '#D5E8E3',
  ivory: '#FFFFFF',
  ivorySoft: '#EAF5F2',
  navText: '#FFFFFF',
  navTextMuted: '#EAF5F2',
  success: '#227B6B',
  warning: '#227B6B',
  error: '#E63950',
} as const;

export const patientClasses = {
  canvas: 'bg-[#F4F8F7] text-[#0E2924]',
  card: 'rounded-2xl border border-[#D5E8E3] bg-[#EAF5F2] text-[#0E2924] shadow-sm',
  cardWhite: 'rounded-2xl border border-[#D5E8E3] bg-white text-[#0E2924] shadow-sm',
  cardInner: 'rounded-xl border border-[#D5E8E3] bg-white/90 p-4',
  heading: 'text-lg font-bold tracking-tight text-[#0E2924]',
  pageHeading: 'text-2xl font-black text-[#0E2924]',
  subheading: 'text-sm font-medium text-[#4B736B]',
  btnPrimary:
    'rounded-xl bg-[#113831] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0E2924] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#227B6B]/40',
  btnSecondary:
    'rounded-xl bg-[#EAF5F2] px-4 py-2.5 text-sm font-semibold text-[#113831] shadow-sm transition hover:bg-[#D5E8E3]',
  btnSecondaryOutline:
    'rounded-xl border border-[#D5E8E3] bg-white px-4 py-2.5 text-sm font-semibold text-[#113831] hover:bg-[#EAF5F2]',
  navShell: 'bg-white text-[#0E2924] border-r border-[#D5E8E3]',
  navActive: 'bg-[#EAF5F2] font-semibold text-[#113831] shadow-sm',
  navActiveAlt: 'bg-[#113831] font-semibold text-white shadow-md',
  navIdle: 'text-[#4B736B] hover:bg-[#F4F8F7] hover:text-[#113831]',
  topBar: 'border-b border-[#D5E8E3] bg-white/95 text-[#0E2924]',
  tabActive: 'bg-[#113831] text-white',
  tabIdle: 'bg-[#EAF5F2] text-[#113831] border border-[#D5E8E3]',
  statusSuccess: 'text-[#227B6B]',
  statusWarning: 'text-[#227B6B]',
  statusError: 'text-[#E63950]',
  badgeSuccess:
    'inline-flex items-center gap-1 rounded-full border border-[#D5E8E3] bg-[#EAF5F2] px-3 py-1 text-xs font-semibold text-[#113831]',
  badgeWarning:
    'inline-flex items-center gap-1 rounded-full border border-[#D5E8E3] bg-[#EAF5F2] px-3 py-1 text-xs font-semibold text-[#227B6B]',
} as const;
