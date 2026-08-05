import {
  Bell,
  CalendarDays,
  LayoutDashboard,
  ScrollText,
  Stethoscope,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type DoctorModuleId =
  | 'dashboard'
  | 'schedule'
  | 'patients'
  | 'consultation'
  | 'prescriptions'
  | 'notifications'
  | 'profile';

export type DoctorNavItem = {
  id: DoctorModuleId;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

/** Doctor App V0 — exactly 7 core modules */
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
    id: 'consultation',
    label: 'Consultations',
    href: '/doctor/consultation',
    icon: Stethoscope,
    description: 'Clinical workstation',
  },
  {
    id: 'prescriptions',
    label: 'Prescriptions',
    href: '/doctor/prescriptions',
    icon: ScrollText,
    description: 'Issue & review Rx',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/doctor/notifications',
    icon: Bell,
    description: 'Alerts & reminders',
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/doctor/profile',
    icon: UserCircle,
    description: 'Account settings',
  },
];

/** Legacy enterprise routes → V0 canonical paths */
export const LEGACY_DOCTOR_REDIRECTS: Record<string, string> = {
  '/doctor/consultations': '/doctor/consultation',
  '/doctor/opd-consultation': '/doctor/consultation',
  '/doctor/opd': '/doctor/consultation',
  '/doctor/e-prescription': '/doctor/prescriptions',
  '/doctor/orders': '/doctor/prescriptions',
  '/doctor/lab-orders': '/doctor/schedule',
  '/doctor/radiology-orders': '/doctor/schedule',
  '/doctor/lab': '/doctor/schedule',
  '/doctor/labs': '/doctor/schedule',
  '/doctor/radiology': '/doctor/schedule',
  '/doctor/surgery-management': '/doctor/schedule',
  '/doctor/surgeries': '/doctor/schedule',
  '/doctor/surgery': '/doctor/schedule',
  '/doctor/ipd-management': '/doctor/patients',
  '/doctor/ipd': '/doctor/patients',
  '/doctor/emergency-cases': '/doctor/dashboard',
  '/doctor/emergency': '/doctor/dashboard',
  '/doctor/emr': '/doctor/patients',
  '/doctor/emr-vault': '/doctor/patients',
  '/doctor/clinical-documents': '/doctor/patients',
  '/doctor/documents': '/doctor/patients',
  '/doctor/ai-assistant': '/doctor/consultation',
  '/doctor/communication': '/doctor/notifications',
  '/doctor/communication-center': '/doctor/notifications',
  '/doctor/messages': '/doctor/notifications',
  '/doctor/telemedicine': '/doctor/consultation',
  '/doctor/telehealth': '/doctor/consultation',
  '/doctor/calendar': '/doctor/schedule',
  '/doctor/scheduler': '/doctor/schedule',
  '/doctor/reports-analytics': '/doctor/dashboard',
  '/doctor/analytics': '/doctor/dashboard',
  '/doctor/reports': '/doctor/dashboard',
  '/doctor/profile-settings': '/doctor/profile',
  '/doctor/settings': '/doctor/profile',
};

export const doctorTheme = {
  bg: '#F4F6F0',
  surface: '#FAFCF8',
  border: '#E2E8E0',
  primary: '#7A9A8B',
  primaryHover: '#6B8B7C',
  primaryLight: '#EEF5F1',
  text: '#2C3531',
  textMuted: '#2C3531',
  dusty: '#D8E2DC',
  success: '#4A856A',
  successBg: '#EEF5F1',
  warning: '#D96B52',
  warningBg: '#FDF0ED',
  pending: '#9A8938',
  pendingBg: '#F8F6E9',
  sidebar: '#1E2522',
  sidebarActive: '#354A41',
  sidebarActiveBorder: '#7A9A8B',
} as const;
