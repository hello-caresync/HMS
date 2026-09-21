/** Regal Patient App — warm latte / chestnut clinical palette */

export const patientTheme = {
  canvas: '#FAF6F0',
  canvasAlt: '#F5EFE6',
  canvasTint: '#FDFBF7',
  card: '#FFFFFF',
  border: '#EBDCCB',
  borderSoft: '#EADBCE',
  sidebarBorder: '#E8DFD5',
  primary: '#8C5A3C',
  primaryHover: '#6F4228',
  secondary: '#DDB892',
  tint: '#F7EFE8',
  text: '#2B1810',
  textAlt: '#5C3826',
  muted: '#7C5C48',
  emergency: '#c1121f',
  success: '#059669',
  warning: '#d97706',
  ivory: '#ffffff',
} as const;

export const patientCanvasClass =
  'min-h-screen w-full bg-[#FAF6F0] text-[#2B1810] overscroll-none antialiased selection:bg-[#8C5A3C] selection:text-white';

export const patientClasses = {
  canvas: patientCanvasClass,
  card: 'rounded-xl border border-[#EBDCCB] bg-white text-[#2B1810] shadow-xs',
  cardCompact: 'rounded-xl border border-[#EADBCE] bg-white p-4 shadow-xs',
  cardWhite: 'rounded-xl border border-[#EBDCCB] bg-white text-[#2B1810] shadow-xs',
  cardInner: 'rounded-lg border border-[#EADBCE] bg-[#FDFBF7] p-3',
  heading: 'text-base font-bold tracking-tight text-[#2B1810]',
  pageHeading: 'text-xl font-bold tracking-tight text-[#2B1810]',
  subheading: 'text-xs font-medium text-[#7C5C48]',
  btnPrimary:
    'rounded-lg bg-[#8C5A3C] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#6F4228] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDB892]/50',
  btnSecondary:
    'rounded-lg bg-[#F3ECE4] px-3.5 py-2 text-xs font-bold text-[#5C3826] shadow-xs transition hover:bg-[#EADBCE]',
  btnSecondaryOutline:
    'rounded-lg border border-[#E6CCB2] bg-white px-3 py-2 text-xs font-medium text-[#7F5539] hover:bg-[#FAF7F2]',
  navShell: 'bg-[#6F4E37] text-white border-r border-[#5B3E2B] select-none',
  navActive:
    'border border-[#8C6246] bg-[#4E3625] font-bold text-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]',
  navActiveAlt:
    'border border-[#8C6246] bg-[#4E3625] font-bold text-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]',
  navIdle: 'text-[#EADBCE] hover:bg-[#5E422E] hover:text-white',
  topBar: 'h-14 border-b border-[#E8DFD5] bg-white/95 text-[#2B1810] backdrop-blur-sm',
  tabActive: 'bg-[#8C5A3C] text-white',
  tabIdle: 'bg-[#F3ECE4] text-[#5C3826] border border-[#EADBCE]',
  statusSuccess: 'text-emerald-700',
  statusWarning: 'text-amber-800',
  statusError: 'text-[#c1121f]',
  badgeSuccess:
    'inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700',
  badgeWarning:
    'inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800',
  chip:
    'inline-flex items-center rounded-lg border border-[#EADBCE]/50 bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-stone-700',
  input:
    'w-full rounded-lg border border-[#EADBCE] bg-[#FDFBF7] px-3 py-2 text-xs font-semibold text-[#2B1810] placeholder:text-[#7C5C48] focus:border-[#8C5A3C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F3ECE4]',
  label: 'text-[10px] font-bold uppercase tracking-wider text-[#7C5C48]',
} as const;
