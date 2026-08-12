/** CuraSync Doctor Command Center — clinical navy identity */
export const ccTheme = {
  primary: '#173F5F',
  secondary: '#20639B',
  accent: '#2A9D8F',
  background: '#F6F9FB',
  surface: '#FFFFFF',
  softBlue: '#E8F1F8',
  success: '#2E8B70',
  warning: '#E9A23B',
  critical: '#D9534F',
  text: '#173F5F',
  textMuted: '#5A7A94',
} as const;

export const ccClasses = {
  page: 'min-h-full bg-[#F6F9FB] text-[#173F5F] font-sans',
  card: 'rounded-2xl border border-[#E8F1F8] bg-white shadow-sm',
  cardSoft: 'rounded-2xl border border-[#E8F1F8] bg-[#E8F1F8]/40',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-[#173F5F] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#20639B] disabled:opacity-50',
  btnAccent:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A9D8F] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50',
  btnGhost:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8F1F8] bg-white px-4 py-2.5 text-sm font-bold text-[#173F5F] transition hover:bg-[#E8F1F8] disabled:opacity-50',
  input:
    'w-full rounded-xl border border-[#E8F1F8] bg-white px-4 py-2.5 text-sm font-semibold text-[#173F5F] outline-none focus:border-[#20639B] focus:ring-2 focus:ring-[#20639B]/20',
} as const;
