/** Nexora Doctor · Sage & Cream workstation tokens */
export const sage = {
  primary: '#A39E75',
  secondary: '#C7C39E',
  light: '#E6E3C5',
  surface: '#F7F6E8',
  bg: '#FAFAF5',
  text: '#2B2A22',
  muted: '#5C5A4E',
} as const;

export const sageUi = {
  page: 'min-h-full bg-[#FAFAF5] text-[#2B2A22]',
  glass: 'rounded-2xl border border-[#C7C39E]/40 bg-[#FAFAF5]/80 shadow-lg backdrop-blur-xl',
  card: 'rounded-xl border border-[#E6E3C5]/80 bg-[#F7F6E8] shadow-sm',
  cardSolid: 'rounded-xl border border-[#C7C39E]/50 bg-white shadow-sm',
  segmentActive: 'bg-[#A39E75] text-white shadow-sm',
  segmentIdle: 'text-[#5C5A4E] hover:bg-[#E6E3C5]/60',
  btnPrimary: 'rounded-lg bg-[#A39E75] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8E8963]',
  btnSecondary:
    'rounded-lg border border-[#C7C39E] bg-[#F7F6E8] px-4 py-2 text-sm font-semibold text-[#2B2A22] hover:bg-[#E6E3C5]/50',
  chip: 'rounded-full border border-[#C7C39E]/60 bg-[#E6E3C5]/40 px-2.5 py-0.5 text-[10px] font-bold',
  input:
    'doctor-input',
  autofill:
    '[&:-webkit-autofill]:bg-[#F7F6E8] [&:-webkit-autofill]:[-webkit-text-fill-color:#2B2A22] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]',
  allergyBadge: 'allergy-badge',
  esiCallout: 'esi-critical-callout',
} as const;
