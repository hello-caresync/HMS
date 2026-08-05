import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { doctorStatusColors, doctorUi } from '@/lib/nexora-doctor/design-tokens';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ui = {
  page: doctorUi.pageInner,
  pageTitle: doctorUi.pageTitle,
  pageSubtitle: doctorUi.pageSubtitle,
  sectionTitle: doctorUi.sectionTitle,
  card: doctorUi.card,
  cardHover: `${doctorUi.card} hover:shadow-sm`,
  input: doctorUi.input,
  select: doctorUi.select,
  btnPrimary: doctorUi.btnPrimary,
  btnSecondary: doctorUi.btnSecondary,
  btnDanger: doctorUi.btnDanger,
  badge: doctorUi.badge,
  table: doctorUi.table,
  th: doctorUi.th,
  td: doctorUi.td,
  link: doctorUi.link,
  scrollList: doctorUi.scrollList,
} as const;

export const statusColors = doctorStatusColors;

export const orderTypeLabels: Record<string, string> = {
  lab: 'Laboratory',
  radiology: 'Radiology',
  procedure: 'Procedure',
  admission: 'Admission',
  surgery: 'Surgery',
  prescription: 'Prescription',
};
