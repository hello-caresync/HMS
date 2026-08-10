/** Nexora Doctor App — clinical plum gradient design tokens */
export const doctorTheme = {
  primaryPlum: '#894A66',
  clinicalMauve: '#93688E',
  dustyPurple: '#9887B1',
  mutedLavender: '#9DA6CD',
  softSlateBlue: '#A9C5E3',
  iceBlue: '#BDE2F5',
  canvas: '#F2F6FA',
  canvasAlt: '#EFE8E1',
  text: '#2C243B',
  textAlt: '#482A41',
} as const;

export const doctorGradient = {
  header: 'from-[#894A66] via-[#93688E] via-[#9887B1] to-[#9DA6CD]',
  button: 'from-[#93688E] to-[#894A66]',
} as const;

/** Compatibility classes used by the existing clinical workspaces. */
export const clinicalClasses = {
  pageBg: 'mx-auto w-full max-w-7xl space-y-6 bg-[#F2F6FA] text-[#2C243B]',
  headerTitle: 'text-2xl font-black tracking-tight text-[#2C243B]',
  headerSubtitle: 'text-sm font-semibold text-[#9887B1]',
  sectionTitle: 'text-xs font-black uppercase tracking-wider text-[#894A66]',
  card: 'rounded-2xl border border-[#9DA6CD]/35 bg-white shadow-sm',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-[#894A66] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#93688E] disabled:cursor-not-allowed disabled:opacity-50',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-[#9DA6CD]/50 bg-white px-4 py-2.5 text-sm font-bold text-[#894A66] transition hover:bg-[#BDE2F5]/30 disabled:cursor-not-allowed disabled:opacity-50',
  btnCritical:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50',
} as const;
