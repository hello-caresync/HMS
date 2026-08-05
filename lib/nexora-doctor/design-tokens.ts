/** Nexora Doctor — Soft Sage & Linen clinical palette */

export const doctorColors = {
  sage: '#7A9A8B',
  text: '#2C3531',
  linen: '#F4F6F0',
  cream: '#FAFCF8',
  dusty: '#D8E2DC',
  border: '#E2E8E0',
  successBg: '#EEF5F1',
  successText: '#4A856A',
  warningBg: '#FDF0ED',
  warningText: '#D96B52',
  pendingBg: '#F8F6E9',
  pendingText: '#9A8938',
} as const;

/** Tailwind class bundles — single source for doctor UI */
export const doctorUi = {
  canvas: 'bg-[#F4F6F0] text-[#2C3531]',
  shell: 'flex min-h-screen w-full overflow-y-auto bg-[#F4F6F0] text-[#2C3531]',
  mainScroll: 'flex-1 overflow-y-auto min-h-0 pb-8',
  main: 'mx-auto w-full max-w-[1600px] flex-1 space-y-6 p-6',
  page: 'mx-auto w-full max-w-[1600px] space-y-6 p-6',
  pageInner: 'mx-auto w-full max-w-[1600px] space-y-6 p-6',
  pageTitle: 'text-2xl font-semibold tracking-tight text-[#2C3531]',
  pageSubtitle: 'mt-1 text-sm text-[#2C3531]/60',
  sectionTitle:
    'border-b border-[#E2E8E0] pb-3 mb-4 text-lg font-semibold tracking-tight text-[#2C3531]',
  card: 'rounded-xl border border-[#E2E8E0] bg-[#FAFCF8] p-5 shadow-xs transition-all hover:border-[#7A9A8B]/30',
  cardMuted: 'rounded-xl border border-[#E2E8E0] bg-[#F4F6F0] p-5',
  input:
    'w-full rounded-xl border border-[#E2E8E0] bg-[#FAFCF8] px-3.5 py-2.5 text-sm text-[#2C3531] placeholder:text-[#2C3531]/40 outline-none transition focus:border-[#7A9A8B] focus:ring-2 focus:ring-[#7A9A8B]/20',
  select:
    'rounded-xl border border-[#E2E8E0] bg-[#FAFCF8] px-3 py-2 text-sm text-[#2C3531] outline-none focus:border-[#7A9A8B] focus:ring-2 focus:ring-[#7A9A8B]/20',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-[#7A9A8B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#6B8A7C] disabled:opacity-50',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8E0] bg-[#FAFCF8] px-4 py-2.5 text-sm font-medium text-[#2C3531] transition hover:bg-[#F4F6F0] disabled:opacity-50',
  btnDanger:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-[#D96B52]/30 bg-[#FDF0ED] px-4 py-2.5 text-sm font-medium text-[#D96B52] transition hover:bg-[#FDF0ED]/80 disabled:opacity-50',
  badge: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
  table: 'w-full text-left text-sm',
  th: 'border-b border-[#E2E8E0] bg-[#F4F6F0] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#2C3531]/80',
  td: 'border-b border-[#E2E8E0]/60 px-4 py-3.5 text-[#2C3531] transition-colors hover:bg-[#EEF5F1]/50',
  trHover: 'hover:bg-[#EEF5F1]/50 transition-colors',
  link: 'text-sm font-medium text-[#7A9A8B] hover:text-[#6B8A7C] hover:underline',
  scrollList: 'max-h-[500px] overflow-y-auto pr-1 custom-scrollbar',
  sidebar:
    'flex h-screen shrink-0 flex-col border-r border-[#28322E] bg-[#1E2522] transition-all',
  sidebarActive:
    'border-l-4 border-[#7A9A8B] bg-[#354A41] font-bold text-white shadow-sm',
  sidebarIdle:
    'text-[#D0D7CF] hover:bg-[#28322E] hover:text-white',
  sidebarHeader: 'border-b border-[#28322E] px-4 py-5',
  sidebarFooter: 'border-t border-[#28322E] p-4',
  topBar: 'flex h-14 shrink-0 items-center gap-4 border-b border-[#E2E8E0] bg-[#FAFCF8] px-4 lg:px-6',
  appointmentBlock:
    'rounded-lg border border-[#7A9A8B] bg-[#EEF5F1] px-3 py-2 text-[#2C3531]',
  vitalsCard: 'rounded-xl border border-[#E2E8E0] bg-[#F4F6F0] p-4 border-l-4 border-l-[#7A9A8B]',
  stepperComplete: 'rounded-full bg-[#EEF5F1] px-3 py-1 text-xs font-medium text-[#4A856A] border border-[#4A856A]/30',
  rxPreview: 'rounded-xl border border-[#E2E8E0] bg-[#FAFCF8] p-6',
} as const;

export const doctorStatusColors: Record<string, string> = {
  scheduled: 'border-[#E2E8E0] bg-[#F4F6F0] text-[#2C3531]/80',
  waiting: 'border-[#D96B52]/30 bg-[#FDF0ED] text-[#D96B52]',
  'in-progress': 'border-[#9A8938]/30 bg-[#F8F6E9] text-[#9A8938]',
  completed: 'border-[#4A856A]/30 bg-[#EEF5F1] text-[#4A856A]',
  cancelled: 'border-[#D96B52]/30 bg-[#FDF0ED] text-[#D96B52]',
  pending: 'border-[#9A8938]/30 bg-[#F8F6E9] text-[#9A8938]',
  draft: 'border-[#E2E8E0] bg-[#F4F6F0] text-[#2C3531]/70',
};
