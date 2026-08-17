/**
 * Regal Hospital Enterprise Platform — unified design tokens.
 */

export const regalTheme = {
  sidebar: '#0F3E5D',
  sidebarFooter: '#0B2C42',
  navActive: '#1E567B',
  accent: '#00A896',
  accentLight: '#2DD4BF',
  canvas: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  textLabel: '#475569',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#059669',
} as const;

export const regalClasses = {
  page: 'min-h-screen bg-[#F8FAFC] font-sans text-slate-900',
  sidebar: 'flex h-screen w-64 shrink-0 flex-col bg-[#0F3E5D] text-white',
  sidebarFooter: 'border-t border-[#0B2C42] bg-[#0B2C42]/40',
  navActive:
    'rounded-lg bg-[#1E567B] px-3 py-2 text-xs font-bold text-white shadow-inner shadow-black/10',
  navIdle: 'rounded-lg px-3 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/10',
  card: 'rounded-xl border border-slate-200 bg-white shadow-sm',
  cardHeader: 'border-b border-slate-200 px-4 py-3',
  label: 'text-xs font-semibold uppercase tracking-wide text-slate-500',
  title: 'text-sm font-black text-slate-900',
  stat: 'text-xl font-black text-slate-900 sm:text-2xl',
  body: 'text-sm text-slate-700',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F3E5D] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#1E567B] disabled:opacity-50',
  btnAccent:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-[#00A896] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#2DD4BF] disabled:opacity-50',
  btnGhost:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50',
  input:
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#00A896] focus:ring-2 focus:ring-[#00A896]/20',
  tableWrap: 'overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm',
  th: 'px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500',
  td: 'px-3 py-2 text-sm text-slate-800',
  bubbleOut: 'rounded-2xl rounded-br-md bg-[#00A896] px-3 py-2 text-sm text-white shadow-sm',
  bubbleIn:
    'rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm',
  unread: 'rounded-full bg-[#00A896] px-1.5 py-0.5 text-[10px] font-bold text-white',
} as const;
