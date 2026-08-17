/** NEXORA Hospital Operations — Warm Sage design tokens */
export const hospitalOpsTheme = {
  primary: '#52796F',
  secondary: '#84A98C',
  muted: '#CAD2C5',
  canvas: '#F7F5EF',
  surface: '#FFFFFF',
  text: '#263238',
  accent: '#D4A373',
  critical: '#C94A29',
} as const;

export const hospitalOpsClasses = {
  canvas: 'bg-[#F7F5EF] text-[#263238]',
  surface: 'bg-white border border-[#CAD2C5] rounded-xl shadow-sm',
  heading: 'text-xl font-black text-[#263238] tracking-tight',
  subheading: 'text-xs font-semibold text-[#52796F]',
  btnPrimary:
    'rounded-lg bg-[#52796F] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#3d5c55] disabled:opacity-50',
  btnSecondary:
    'rounded-lg border border-[#CAD2C5] bg-white px-3 py-2 text-xs font-bold text-[#263238] hover:bg-[#F7F5EF]',
  btnCritical:
    'rounded-lg bg-[#C94A29] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#a83d22]',
  badgeDefault: 'bg-[#CAD2C5]/40 text-[#263238] border border-[#CAD2C5]',
  badgeWarning: 'bg-[#D4A373]/20 text-[#8B6914] border border-[#D4A373]/50',
  badgeCritical: 'bg-[#C94A29]/15 text-[#C94A29] border border-[#C94A29]/40',
  input:
    'w-full rounded-lg border border-[#CAD2C5] bg-white px-3 py-2 text-xs font-semibold text-[#263238] placeholder:text-[#84A98C] focus:outline-none focus:ring-2 focus:ring-[#52796F]/30',
  sidebar:
    'bg-[#52796F] text-white border-r border-[#3d5c55] w-56 shrink-0 flex flex-col h-screen',
  sidebarLinkActive: 'bg-[#3d5c55] text-white font-black',
  sidebarLinkIdle: 'text-[#CAD2C5] hover:bg-[#456860] hover:text-white',
} as const;
