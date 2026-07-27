/**
 * Nexora Doctor · Clinical Design System
 * Apple Health clarity · Linear density · Notion structure · Epic clinical depth
 */
export const nx = {
  /** Core palette */
  ink: '#1C1B18',
  inkSecondary: '#3D3C36',
  inkMuted: '#6B6860',
  inkFaint: '#9C9890',
  canvas: '#F8F7F4',
  canvasElevated: '#FFFFFF',
  surface: '#F3F2ED',
  surfaceHover: '#EBE9E2',
  border: 'rgba(28, 27, 24, 0.08)',
  borderStrong: 'rgba(28, 27, 24, 0.14)',

  /** Clinical accent — refined sage */
  accent: '#7A7558',
  accentHover: '#6A6550',
  accentSoft: 'rgba(122, 117, 88, 0.12)',
  accentMuted: '#B8B49A',

  /** Session semantics */
  opd: { bg: '#EEF4FF', border: '#3B82F6', text: '#1E40AF', dot: '#3B82F6' },
  ot: { bg: '#F5F0FF', border: '#7C3AED', text: '#5B21B6', dot: '#7C3AED' },
  ward: { bg: '#ECFDF5', border: '#059669', text: '#047857', dot: '#059669' },
  tele: { bg: '#F0FDFA', border: '#0D9488', text: '#0F766E', dot: '#0D9488' },
  leave: { bg: '#FFF1F2', border: '#E11D48', text: '#BE123C', dot: '#E11D48' },

  /** Status */
  live: '#10B981',
  critical: '#DC2626',
  warning: '#D97706',

  /** Typography scale */
  fontDisplay: 'font-semibold tracking-[-0.02em]',
  fontLabel: 'text-[11px] font-medium uppercase tracking-[0.06em]',
  fontMeta: 'text-[12px] font-medium text-[#6B6860]',
  fontData: 'text-[13px] font-semibold tabular-nums',
} as const;

export const nxUi = {
  page: 'min-h-full bg-[#F8F7F4] text-[#1C1B18] antialiased',
  shell: 'rounded-2xl border border-[rgba(28,27,24,0.08)] bg-white shadow-[0_1px_3px_rgba(28,27,24,0.04)]',
  shellGlass:
    'rounded-2xl border border-[rgba(28,27,24,0.06)] bg-white/80 shadow-[0_4px_24px_rgba(28,27,24,0.06)] backdrop-blur-xl',
  card: 'rounded-xl border border-[rgba(28,27,24,0.08)] bg-white transition-shadow hover:shadow-[0_4px_16px_rgba(28,27,24,0.06)]',
  cardInteractive:
    'rounded-xl border border-[rgba(28,27,24,0.08)] bg-white transition-all hover:border-[rgba(28,27,24,0.14)] hover:shadow-[0_4px_16px_rgba(28,27,24,0.08)] active:scale-[0.995]',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-[#1C1B18] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3D3C36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A7558]/40 disabled:opacity-50',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-[rgba(28,27,24,0.12)] bg-white px-4 py-2 text-[13px] font-semibold text-[#1C1B18] transition hover:bg-[#F3F2ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A7558]/30',
  btnGhost:
    'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-[#6B6860] transition hover:bg-[#F3F2ED] hover:text-[#1C1B18]',
  input:
    'w-full rounded-lg border border-[rgba(28,27,24,0.12)] bg-white px-3 py-2 text-[13px] text-[#1C1B18] placeholder:text-[#9C9890] focus:border-[#7A7558] focus:outline-none focus:ring-2 focus:ring-[#7A7558]/20',
  chip: 'inline-flex items-center gap-1.5 rounded-full border border-[rgba(28,27,24,0.08)] bg-[#F3F2ED] px-2.5 py-1 text-[11px] font-semibold text-[#3D3C36]',
  chipLive: 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700',
  segmentTrack: 'inline-flex rounded-lg bg-[#F3F2ED] p-0.5',
  segmentActive: 'rounded-md bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1C1B18] shadow-sm',
  segmentIdle: 'rounded-md px-3 py-1.5 text-[12px] font-medium text-[#6B6860] hover:text-[#1C1B18]',
  divider: 'h-px bg-[rgba(28,27,24,0.08)]',
} as const;

/** Session category → visual tokens */
export type SessionCategory = 'opd' | 'ot' | 'ward' | 'telehealth' | 'leave';

export function sessionTokens(category: SessionCategory) {
  const map = {
    opd: nx.opd,
    ot: nx.ot,
    ward: nx.ward,
    telehealth: nx.tele,
    leave: nx.leave,
  } as const;
  return map[category];
}
