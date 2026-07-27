/** Nexora Patient App — 5-color luxury swatch + status tokens (WCAG) */

export const patientTheme = {
  plum: '#482A41',
  canvas: '#E2D2C8',
  card: '#CEB2C0',
  lavender: '#8E7692',
  primary: '#572E54',
  /** Body & card copy on light surfaces */
  text: '#482A41',
  charcoal: '#1F2937',
  muted: '#8E7692',
  ivory: '#FFFFFF',
  ivorySoft: '#F3E8EE',
  navText: '#FFFFFF',
  navTextMuted: '#F3E8EE',
  border: '#8E7692',
  success: '#5E8B7E',
  warning: '#D8A657',
  error: '#B85C5C',
  emergency: '#E63946',
} as const;

export const patientClasses = {
  canvas: 'bg-patient-canvas text-patient-text',
  card: 'rounded-2xl border border-patient-lavender/30 bg-patient-card text-patient-text shadow-sm',
  cardWhite: 'rounded-2xl border border-patient-lavender/30 bg-white text-patient-text shadow-sm',
  cardInner: 'rounded-xl border border-patient-lavender/20 bg-white/80 p-4',
  heading: 'text-lg font-bold tracking-tight text-patient-plum',
  pageHeading: 'text-2xl font-black text-patient-plum',
  subheading: 'text-sm font-medium text-patient-lavender',
  btnPrimary:
    'rounded-xl bg-patient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-patient-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patient-primary/40',
  btnSecondary:
    'rounded-xl bg-patient-lavender px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-patient-lavender/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patient-lavender/40',
  btnSecondaryOutline:
    'rounded-xl border border-patient-lavender/40 bg-patient-lavender/20 px-4 py-2.5 text-sm font-semibold text-patient-plum hover:bg-patient-lavender/30',
  navShell: 'bg-patient-plum text-white',
  navActive: 'bg-patient-primary font-semibold text-white shadow-md',
  navActiveAlt: 'bg-white font-semibold text-patient-plum shadow-md',
  navIdle: 'text-patient-ivory-soft hover:bg-white/10 hover:text-white',
  topBar: 'border-b border-white/10 bg-patient-plum text-white',
  tabActive: 'bg-patient-primary text-white',
  tabIdle: 'bg-patient-card text-patient-plum border border-patient-lavender/30',
  statusSuccess: 'text-patient-success',
  statusWarning: 'text-patient-warning',
  statusError: 'text-patient-error',
  badgeSuccess:
    'inline-flex items-center gap-1 rounded-full border border-patient-success/40 bg-patient-success/15 px-3 py-1 text-xs font-semibold text-patient-plum',
  badgeWarning:
    'inline-flex items-center gap-1 rounded-full border border-patient-warning/40 bg-patient-warning/20 px-3 py-1 text-xs font-semibold text-patient-plum',
} as const;
