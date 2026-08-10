import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bell,
  Calendar,
  FileText,
  LayoutDashboard,
  PlusCircle,
  Stethoscope,
  User,
} from 'lucide-react';

import { patientTheme } from '@/lib/patient/theme';

/** Nexora Patient App — canonical route map */
export const PATIENT_ROUTES = {
  root: '/patient',
  login: '/patient/auth/login',
  dashboard: '/patient/dashboard',
  appointments: '/patient/appointments',
  bookAppointment: '/patient/appointments/book',
  queue: '/patient/queue',
  doctors: '/patient/doctors',
  records: '/patient/records',
  prescriptions: '/patient/prescriptions',
  notifications: '/patient/notifications',
  profile: '/patient/profile',
  settings: '/patient/settings',
  emergency: '/patient/emergency',
  /** Legacy redirects */
  health: '/patient/records',
  medications: '/patient/prescriptions',
  diagnostics: '/patient/records',
  billing: '/patient/dashboard',
  insurance: '/patient/profile',
  telemedicine: '/patient/dashboard',
  teleconsult: '/patient/dashboard',
  communication: '/patient/notifications',
  messages: '/patient/messages',
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
  /** Rose-red SOS styling */
  highlight?: 'emergency';
};

/** Full patient sidebar — core use-case modules (SOS lives on Dashboard) */
export const PATIENT_NAV_ITEMS: PatientNavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: PATIENT_ROUTES.dashboard,
    icon: LayoutDashboard,
    mobilePrimary: true,
    description: "Today's care snapshot and quick actions",
  },
  {
    key: 'appointments',
    label: 'Appointments',
    href: PATIENT_ROUTES.appointments,
    icon: Calendar,
    mobilePrimary: true,
    description: 'View and manage your visits',
  },
  {
    key: 'book',
    label: 'Book Appointment',
    href: PATIENT_ROUTES.bookAppointment,
    icon: PlusCircle,
    description: 'Schedule a new OPD or teleconsult visit',
  },
  {
    key: 'queue',
    label: 'Live OPD Queue',
    href: PATIENT_ROUTES.queue,
    icon: Activity,
    mobilePrimary: true,
    description: 'Track your token and wait time in real time',
  },
  {
    key: 'doctors',
    label: 'Doctors Directory',
    href: PATIENT_ROUTES.doctors,
    icon: Stethoscope,
    description: 'Find specialists and view profiles',
  },
  {
    key: 'prescriptions',
    label: 'Records & Prescriptions',
    href: PATIENT_ROUTES.prescriptions,
    icon: FileText,
    description: 'Medical records, labs, and e-prescriptions',
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
    label: 'Profile & Family',
    href: PATIENT_ROUTES.profile,
    icon: User,
    description: 'Account, dependents, and insurance',
  },
];

export const PATIENT_BRAND = {
  name: 'NEXORA PATIENT',
  icon: Stethoscope,
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
