/** Smart OPD Engine — Luxury Plum & Beige design tokens */

export const opdUi = {
  topBar: 'bg-[#482A41] text-white border-b border-white/10',
  canvas: 'bg-[#E2D2C8] text-[#482A41]',
  card: 'rounded-2xl border border-[#8E7692]/30 bg-white shadow-sm',
  cardMauve: 'rounded-2xl border border-[#8E7692]/30 bg-[#CEB2C0]/40 shadow-sm',
  btnPrimary: 'rounded-xl bg-[#572E54] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#482A41] transition',
  btnSecondary: 'rounded-xl border border-[#8E7692]/40 bg-white px-4 py-2.5 text-sm font-bold text-[#572E54] hover:bg-[#CEB2C0]/30 transition',
  btnEmergency: 'rounded-xl bg-[#B85C5C] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition',
  badgeOnTime: 'inline-flex items-center gap-1.5 rounded-full bg-[#5E8B7E]/20 px-3 py-1 text-xs font-bold text-[#5E8B7E]',
  badgeDelay: 'inline-flex items-center gap-1.5 rounded-full bg-[#D8A657]/25 px-3 py-1 text-xs font-bold text-[#482A41]',
  badgeUrgent: 'inline-flex items-center gap-1.5 rounded-full bg-[#B85C5C]/20 px-3 py-1 text-xs font-bold text-[#B85C5C]',
  waitMetric: 'text-5xl font-black tabular-nums text-[#572E54]',
  aiSlot: 'rounded-xl border-2 border-[#572E54]/40 bg-[#572E54]/10 px-3 py-2 ring-2 ring-[#572E54]/20',
} as const;

export type DoctorDelayStatus = 'on-time' | 'slight-delay' | 'urgent';
export type VoiceLanguage = 'en' | 'hi' | 'ml';

export const VOICE_LANGUAGES: { id: VoiceLanguage; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'hi', label: 'HI' },
  { id: 'ml', label: 'ML' },
];

export function delayBadgeClass(status: DoctorDelayStatus): string {
  switch (status) {
    case 'on-time':
      return opdUi.badgeOnTime;
    case 'slight-delay':
      return opdUi.badgeDelay;
    case 'urgent':
      return opdUi.badgeUrgent;
  }
}

export function delayLabel(status: DoctorDelayStatus): string {
  switch (status) {
    case 'on-time':
      return '● Doctor is on time';
    case 'slight-delay':
      return '● Slight delay (~10 min)';
    case 'urgent':
      return '● Emergency case in progress';
  }
}
