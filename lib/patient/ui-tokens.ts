/** Shared Tailwind class strings — Nexora Patient 5-color system (WCAG-safe). */

import { patientClasses } from '@/lib/patient/theme';

const borderSoft = 'border-patient-lavender/30';

export const patientUi = {
  canvas: patientClasses.canvas,
  panel: `rounded-2xl ${borderSoft} bg-white p-6 text-patient-text shadow-sm`,
  panelMauve: `rounded-2xl ${borderSoft} bg-patient-card p-6 text-patient-text shadow-sm`,
  card: `rounded-xl ${borderSoft} bg-white p-4 text-patient-text shadow-sm`,
  cardMauve: `rounded-xl ${borderSoft} bg-patient-card p-4 text-patient-text shadow-sm`,
  cardMuted: `rounded-xl ${borderSoft} bg-patient-lavender/15 p-4 text-patient-text`,
  vitalCard: `flex items-center justify-between rounded-xl ${borderSoft} bg-white p-4 text-patient-text shadow-sm`,
  pageTitle: patientClasses.pageHeading,
  sectionTitle: 'text-lg font-black text-patient-plum',
  sectionLabel: 'text-sm font-black uppercase tracking-wide text-patient-plum',
  bodyMuted: 'text-sm font-medium text-patient-lavender',
  body: 'text-sm font-medium text-patient-charcoal',
  icon: 'text-patient-primary',
  chipActive:
    'rounded-full bg-patient-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-patient-plum',
  chipIdle: `rounded-full ${borderSoft} bg-patient-card px-3 py-1.5 text-xs font-bold text-patient-plum hover:bg-patient-lavender/25`,
  selectChipActive: 'rounded-lg border border-patient-primary bg-patient-primary text-white font-bold',
  selectChipIdle: `rounded-lg ${borderSoft} bg-patient-lavender/20 text-patient-plum font-bold hover:border-patient-lavender`,
  btnPrimary: patientClasses.btnPrimary,
  btnSecondary: patientClasses.btnSecondary,
  btnSecondaryOutline: patientClasses.btnSecondaryOutline,
  link: 'text-sm font-bold text-patient-primary hover:underline',
  metric: 'font-black tabular-nums text-patient-primary',
  metricLabel: 'text-[10px] font-bold uppercase tracking-wider text-patient-lavender',
  badgeMuted: `inline-flex rounded-full ${borderSoft} bg-patient-lavender/20 px-3 py-1 text-xs font-semibold text-patient-plum`,
  badgeAccent: 'inline-flex rounded-full bg-patient-primary/15 px-3 py-1 text-xs font-bold text-patient-primary',
  badgeAlert: `inline-flex rounded-full ${borderSoft} bg-white px-3 py-1 text-xs font-semibold text-patient-plum`,
  input: `w-full rounded-xl ${borderSoft} bg-white px-4 py-2.5 text-sm font-medium text-patient-text placeholder:text-patient-lavender/60 focus:border-patient-primary focus:outline-none focus:ring-2 focus:ring-patient-primary/25`,
  compareBar: 'h-full rounded-full bg-gradient-to-r from-patient-primary to-patient-success',
  progressTrack: 'h-2.5 overflow-hidden rounded-full bg-patient-lavender/25',
  progressFill: 'h-full rounded-full bg-patient-primary transition-all duration-500',
} as const;
