import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  ClipboardList,
  Stethoscope,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type DoctorModuleId =
  | 'dashboard'
  | 'schedule'
  | 'patients'
  | 'consultations'
  | 'orders'
  | 'communication'
  | 'analytics'
  | 'profile';

export type DoctorNavItem = {
  id: DoctorModuleId;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

/** Exactly 8 core workspaces — no extras */
export const DOCTOR_NAV: DoctorNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/doctor/dashboard',
    icon: LayoutDashboard,
    description: "Today's overview",
  },
  {
    id: 'schedule',
    label: 'Schedule',
    href: '/doctor/schedule',
    icon: CalendarDays,
    description: 'Appointments & calendar',
  },
  {
    id: 'patients',
    label: 'Patients',
    href: '/doctor/patients',
    icon: Users,
    description: 'Assigned patients',
  },
  {
    id: 'consultations',
    label: 'Consultations',
    href: '/doctor/consultations',
    icon: Stethoscope,
    description: 'Complete consultations',
  },
  {
    id: 'orders',
    label: 'Orders',
    href: '/doctor/orders',
    icon: ClipboardList,
    description: 'Lab, radiology & more',
  },
  {
    id: 'communication',
    label: 'Communication',
    href: '/doctor/communication',
    icon: MessageSquare,
    description: 'Messages & telehealth',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/doctor/analytics',
    icon: BarChart3,
    description: 'Performance insights',
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/doctor/profile',
    icon: UserCircle,
    description: 'Account settings',
  },
];

/** Legacy route → canonical 8-module redirect map */
export const LEGACY_DOCTOR_REDIRECTS: Record<string, string> = {
  '/doctor/opd-consultation': '/doctor/consultations',
  '/doctor/opd': '/doctor/consultations',
  '/doctor/consultation': '/doctor/consultations',
  '/doctor/ipd-management': '/doctor/patients',
  '/doctor/ipd': '/doctor/patients',
  '/doctor/emergency-cases': '/doctor/dashboard',
  '/doctor/emergency': '/doctor/dashboard',
  '/doctor/emr': '/doctor/patients',
  '/doctor/emr-vault': '/doctor/patients',
  '/doctor/e-prescription': '/doctor/consultations',
  '/doctor/prescriptions': '/doctor/consultations',
  '/doctor/lab-orders': '/doctor/orders',
  '/doctor/radiology-orders': '/doctor/orders',
  '/doctor/lab': '/doctor/orders',
  '/doctor/labs': '/doctor/orders',
  '/doctor/radiology': '/doctor/orders',
  '/doctor/surgery-management': '/doctor/orders',
  '/doctor/surgeries': '/doctor/orders',
  '/doctor/surgery': '/doctor/orders',
  '/doctor/telemedicine': '/doctor/communication',
  '/doctor/telehealth': '/doctor/communication',
  '/doctor/clinical-documents': '/doctor/patients',
  '/doctor/documents': '/doctor/patients',
  '/doctor/ai-assistant': '/doctor/consultations',
  '/doctor/communication-center': '/doctor/communication',
  '/doctor/messages': '/doctor/communication',
  '/doctor/notifications': '/doctor/communication',
  '/doctor/calendar': '/doctor/schedule',
  '/doctor/scheduler': '/doctor/schedule',
  '/doctor/reports-analytics': '/doctor/analytics',
  '/doctor/analytics': '/doctor/analytics',
  '/doctor/reports': '/doctor/analytics',
  '/doctor/profile-settings': '/doctor/profile',
  '/doctor/settings': '/doctor/profile',
};

export const doctorTheme = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  primary: '#0F766E',
  primaryHover: '#0D9488',
  primaryLight: '#CCFBF1',
  text: '#0F172A',
  textMuted: '#64748B',
  accent: '#14B8A6',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#059669',
  sidebar: '#FFFFFF',
  sidebarActive: '#F0FDFA',
  sidebarActiveBorder: '#0F766E',
} as const;
