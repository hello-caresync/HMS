import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  CalendarDays,
  FileStack,
  HeartHandshake,
  LayoutDashboard,
  ScrollText,
  Stethoscope,
  UserCog,
} from 'lucide-react';

import { patientTheme } from '@/lib/patient/theme';

/** Nexora Patient App V0 — canonical route map */
export const PATIENT_ROUTES = {
  root: '/patient',
  login: '/patient/auth/login',
  dashboard: '/patient/dashboard',
  appointments: '/patient/appointments',
  doctors: '/patient/doctors',
  records: '/patient/records',
  prescriptions: '/patient/prescriptions',
  notifications: '/patient/notifications',
  profile: '/patient/profile',
  settings: '/patient/settings',
  /** Legacy redirects */
  health: '/patient/records',
  medications: '/patient/prescriptions',
  diagnostics: '/patient/records',
  billing: '/patient/dashboard',
  insurance: '/patient/profile',
  emergency: '/patient/profile',
  telemedicine: '/patient/dashboard',
  teleconsult: '/patient/dashboard',
  communication: '/patient/notifications',
  messages: '/patient/notifications',
  carePlan: '/patient/dashboard',
} as const;

export type PatientRouteKey = keyof typeof PATIENT_ROUTES;

export type PatientNavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  mobilePrimary?: boolean;
  description?: string;
};

/** V0 sidebar — 7 modules only */
export const PATIENT_NAV_ITEMS: PatientNavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: PATIENT_ROUTES.dashboard,
    icon: LayoutDashboard,
    mobilePrimary: true,
    description: 'Today’s care snapshot and quick actions',
  },
  {
    key: 'appointments',
    label: 'Appointments',
    href: PATIENT_ROUTES.appointments,
    icon: CalendarDays,
    mobilePrimary: true,
    description: 'Book, reschedule, and manage visits',
  },
  {
    key: 'doctors',
    label: 'Doctors',
    href: PATIENT_ROUTES.doctors,
    icon: Stethoscope,
    mobilePrimary: true,
    description: 'Find specialists and view profiles',
  },
  {
    key: 'records',
    label: 'Medical Records',
    href: PATIENT_ROUTES.records,
    icon: FileStack,
    description: 'Visit history, labs, and imaging',
  },
  {
    key: 'prescriptions',
    label: 'Prescriptions',
    href: PATIENT_ROUTES.prescriptions,
    icon: ScrollText,
    description: 'Current and previous medicines',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    href: PATIENT_ROUTES.notifications,
    icon: Bell,
    mobilePrimary: true,
    description: 'Appointment and report alerts',
  },
  {
    key: 'profile',
    label: 'Profile',
    href: PATIENT_ROUTES.profile,
    icon: UserCog,
    description: 'Account, insurance, and settings',
  },
];

export const PATIENT_BRAND = {
  name: 'NEXORA PATIENT',
  icon: HeartHandshake,
  ...patientTheme,
} as const;

export function isPatientNavActive(pathname: string, href: string): boolean {
  if (href === PATIENT_ROUTES.dashboard) {
    return pathname === PATIENT_ROUTES.dashboard || pathname === `${PATIENT_ROUTES.dashboard}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function patientMobilePrimaryNav() {
  return PATIENT_NAV_ITEMS.filter((item) => item.mobilePrimary);
}

export const PATIENT_NAV_SECTIONS: { id: string; title: string }[] = [];

export function patientNavBySection(_section: string) {
  return PATIENT_NAV_ITEMS;
}
