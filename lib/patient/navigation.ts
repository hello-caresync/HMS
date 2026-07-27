import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  CalendarDays,
  CreditCard,
  FileStack,
  HeartHandshake,
  HeartPulse,
  LayoutDashboard,
  Pill,
  ScrollText,
  Shield,
  ShieldAlert,
  TestTube,
  UserCog,
  Video,
} from 'lucide-react';

import { patientTheme } from '@/lib/patient/theme';

/** Nexora Patient App — canonical route map (PWA / static export safe). */
export const PATIENT_ROUTES = {
  root: '/patient',
  dashboard: '/patient/dashboard',
  appointments: '/patient/appointments',
  /** Unified video + secure messaging hub */
  telemedicine: '/patient/telemedicine',
  /** @deprecated Use {@link PATIENT_ROUTES.telemedicine} */
  teleconsult: '/patient/telemedicine',
  health: '/patient/health',
  medications: '/patient/medications',
  prescriptions: '/patient/prescriptions',
  records: '/patient/records',
  diagnostics: '/patient/diagnostics',
  billing: '/patient/billing',
  insurance: '/patient/insurance',
  /** @deprecated Use {@link PATIENT_ROUTES.telemedicine} (?tab=messages) */
  communication: '/patient/telemedicine',
  notifications: '/patient/notifications',
  emergency: '/patient/emergency',
  profile: '/patient/profile',
} as const;

export type PatientRouteKey = keyof typeof PATIENT_ROUTES;

export type PatientNavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown in mobile bottom bar (max 5). */
  mobilePrimary?: boolean;
  description?: string;
};

/** Flat sidebar — 13 modules, no category headers. */
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
    description: 'Book, reschedule, and check in',
  },
  {
    key: 'telemedicine',
    label: 'Telemedicine & Messages',
    href: PATIENT_ROUTES.telemedicine,
    icon: Video,
    mobilePrimary: true,
    description: 'Video visits, waiting room, and care team chat',
  },
  {
    key: 'health',
    label: 'My Health',
    href: PATIENT_ROUTES.health,
    icon: HeartPulse,
    mobilePrimary: true,
    description: 'Vitals, wearables, and wellness trends',
  },
  {
    key: 'medications',
    label: 'Medications',
    href: PATIENT_ROUTES.medications,
    icon: Pill,
    description: 'Adherence tracker and refill requests',
  },
  {
    key: 'prescriptions',
    label: 'Prescriptions',
    href: PATIENT_ROUTES.prescriptions,
    icon: ScrollText,
    description: 'Active Rx and pharmacy routing',
  },
  {
    key: 'records',
    label: 'Health Records',
    href: PATIENT_ROUTES.records,
    icon: FileStack,
    description: 'EMR vault · allergies · problem list',
  },
  {
    key: 'diagnostics',
    label: 'Diagnostics',
    href: PATIENT_ROUTES.diagnostics,
    icon: TestTube,
    description: 'Labs and imaging summaries',
  },
  {
    key: 'billing',
    label: 'Billing & Payments',
    href: PATIENT_ROUTES.billing,
    icon: CreditCard,
    description: 'Statements and secure pay',
  },
  {
    key: 'insurance',
    label: 'Insurance',
    href: PATIENT_ROUTES.insurance,
    icon: Shield,
    description: 'Coverage, pre-auth, and ID cards',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    href: PATIENT_ROUTES.notifications,
    icon: Bell,
    description: 'Alerts, reminders, and results ready',
  },
  {
    key: 'emergency',
    label: 'Emergency & Family',
    href: PATIENT_ROUTES.emergency,
    icon: ShieldAlert,
    description: 'SOS, ICE contacts, and family proxies',
  },
  {
    key: 'profile',
    label: 'Account & Settings',
    href: PATIENT_ROUTES.profile,
    icon: UserCog,
    mobilePrimary: true,
    description: 'MFA, privacy, and household profiles',
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
  if (href === PATIENT_ROUTES.telemedicine) {
    return (
      pathname === PATIENT_ROUTES.telemedicine ||
      pathname.startsWith(`${PATIENT_ROUTES.telemedicine}/`) ||
      pathname === '/patient/teleconsult' ||
      pathname.startsWith('/patient/teleconsult/') ||
      pathname === '/patient/communication' ||
      pathname.startsWith('/patient/communication/')
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function patientMobilePrimaryNav() {
  return PATIENT_NAV_ITEMS.filter((item) => item.mobilePrimary);
}

/** @deprecated Sidebar uses flat PATIENT_NAV_ITEMS — sections removed for zero-clutter nav. */
export const PATIENT_NAV_SECTIONS: { id: string; title: string }[] = [];

export function patientNavBySection(_section: string) {
  return PATIENT_NAV_ITEMS;
}
