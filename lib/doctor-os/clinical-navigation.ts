import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  ClipboardList,
  FileText,
  FlaskConical,
  LayoutDashboard,
  MessageSquare,
  Pill,
  ScanLine,
  Scissors,
  Settings,
  Stethoscope,
  Siren,
  Users,
  Video,
} from 'lucide-react';

/** Sage & Cream enterprise — 19-module clinical sidebar */
export type ClinicalNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

export const CLINICAL_SIDEBAR_NAV: ClinicalNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
  { id: 'schedule', label: 'My Schedule', href: '/doctor/schedule', icon: CalendarDays },
  { id: 'patients', label: 'My Patients', href: '/doctor/patients', icon: Users },
  { id: 'opd', label: 'OPD Consultation', href: '/doctor/opd-consultation', icon: Stethoscope },
  { id: 'ipd', label: 'IPD Management', href: '/doctor/ipd-management', icon: Activity },
  { id: 'emergency', label: 'Emergency Cases', href: '/doctor/emergency-cases', icon: Siren },
  { id: 'emr', label: 'EMR', href: '/doctor/emr', icon: FileText },
  { id: 'eprescription', label: 'e-Prescription', href: '/doctor/e-prescription', icon: Pill },
  { id: 'lab', label: 'Laboratory Orders', href: '/doctor/lab-orders', icon: FlaskConical },
  { id: 'radiology', label: 'Radiology Orders', href: '/doctor/radiology-orders', icon: ScanLine },
  { id: 'surgery', label: 'Surgery Management', href: '/doctor/surgery-management', icon: Scissors },
  { id: 'telemedicine', label: 'Telemedicine', href: '/doctor/telemedicine', icon: Video },
  { id: 'documents', label: 'Clinical Documents', href: '/doctor/clinical-documents', icon: ClipboardList },
  { id: 'ai', label: 'AI Clinical Assistant', href: '/doctor/ai-assistant', icon: Bot },
  { id: 'communication', label: 'Communication Center', href: '/doctor/communication-center', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications', href: '/doctor/notifications', icon: Bell },
  { id: 'calendar', label: 'Calendar', href: '/doctor/calendar', icon: CalendarDays },
  { id: 'reports', label: 'Reports & Analytics', href: '/doctor/reports-analytics', icon: BarChart3 },
  { id: 'profile', label: 'Profile & Settings', href: '/doctor/profile-settings', icon: Settings },
];

/** Route aliases for active-state highlighting */
export const CLINICAL_NAV_ALIASES: Record<string, string[]> = {
  '/doctor/dashboard': ['/doctor/dashboard'],
  '/doctor/schedule': ['/doctor/schedule', '/doctor/scheduler'],
  '/doctor/patients': ['/doctor/patients'],
  '/doctor/opd-consultation': ['/doctor/opd-consultation', '/doctor/opd', '/doctor/care-center', '/doctor/consultations', '/doctor/consultation'],
  '/doctor/ipd-management': ['/doctor/ipd-management', '/doctor/ipd'],
  '/doctor/emergency-cases': ['/doctor/emergency-cases', '/doctor/emergency'],
  '/doctor/emr': ['/doctor/emr', '/doctor/emr-vault'],
  '/doctor/e-prescription': ['/doctor/e-prescription', '/doctor/prescriptions', '/doctor/clinical'],
  '/doctor/lab-orders': ['/doctor/lab-orders', '/doctor/lab', '/doctor/labs', '/doctor/orders'],
  '/doctor/radiology-orders': ['/doctor/radiology-orders', '/doctor/radiology'],
  '/doctor/surgery-management': ['/doctor/surgery-management', '/doctor/surgeries', '/doctor/surgery'],
  '/doctor/telemedicine': ['/doctor/telemedicine', '/doctor/telehealth'],
  '/doctor/clinical-documents': ['/doctor/clinical-documents', '/doctor/documents'],
  '/doctor/ai-assistant': ['/doctor/ai-assistant'],
  '/doctor/communication-center': ['/doctor/communication-center', '/doctor/messages', '/doctor/communication'],
  '/doctor/notifications': ['/doctor/notifications'],
  '/doctor/calendar': ['/doctor/calendar'],
  '/doctor/reports-analytics': ['/doctor/reports-analytics', '/doctor/analytics', '/doctor/reports'],
  '/doctor/profile-settings': ['/doctor/profile-settings', '/doctor/settings'],
};

export function isClinicalNavActive(pathname: string, href: string): boolean {
  const paths = CLINICAL_NAV_ALIASES[href] ?? [href];
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Sage & Cream sidebar item classes */
export const sageSidebar = {
  aside: 'h-screen sticky top-0 flex w-[260px] shrink-0 flex-col justify-between border-r border-[#E6E3C5]/80 bg-[#F7F6E8]',
  brand: 'border-b border-[#E6E3C5]/60 bg-gradient-to-br from-[#2B2A22] to-[#3D3C32] p-4 text-[#FAFAF5]',
  navScroll: 'custom-scrollbar flex-1 overflow-y-auto max-h-[calc(100vh-160px)] space-y-1 px-2 py-3 pr-1',
  linkActive:
    'flex items-center gap-2.5 rounded-r-lg border-l-4 border-[#A39E75] bg-[#E6E3C5] px-3 py-2.5 text-[13px] font-bold text-[#2B2A22] transition-all',
  linkInactive:
    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#5A584A] transition-all hover:bg-[#F7F6E8] hover:text-[#2B2A22]',
  iconActive: 'text-[#2B2A22]',
  iconInactive: 'text-[#A39E75]',
  footer: 'border-t border-[#E6E3C5]/60 bg-[#FAFAF5] p-3',
  signOut:
    'flex w-full items-center justify-center gap-2 rounded-xl border border-[#E6E3C5] bg-white/80 px-3 py-2.5 text-[13px] font-semibold text-[#5A584A] hover:border-[#A39E75]/40 hover:text-[#2B2A22]',
  version: 'mt-2 text-center text-[10px] font-medium text-[#5A584A]/70',
} as const;
