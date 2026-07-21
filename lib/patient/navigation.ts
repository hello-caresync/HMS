import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  CreditCard,
  FileStack,
  HeartHandshake,
  HeartPulse,
  LayoutDashboard,
  MessageSquare,
  Pill,
  ScrollText,
  ShieldAlert,
  TestTube,
  UserCog,
  Video,
} from 'lucide-react';

/** Nexora Patient App — canonical route map (PWA / static export safe). */
export const PATIENT_ROUTES = {
  root: '/patient',
  dashboard: '/patient/dashboard',
  appointments: '/patient/appointments',
  teleconsult: '/patient/teleconsult',
  health: '/patient/health',
  medications: '/patient/medications',
  prescriptions: '/patient/prescriptions',
  records: '/patient/records',
  diagnostics: '/patient/diagnostics',
  billing: '/patient/billing',
  communication: '/patient/communication',
  emergency: '/patient/emergency',
  profile: '/patient/profile',
} as const;

export type PatientRouteKey = keyof typeof PATIENT_ROUTES;

export type PatientNavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown in mobile bottom bar (max 5 primary + overflow). */
  mobilePrimary?: boolean;
  section: 'journey' | 'clinical' | 'financial' | 'safety' | 'account';
  description?: string;
};

export const PATIENT_NAV_SECTIONS: { id: PatientNavItem['section']; title: string }[] = [
  { id: 'journey', title: 'Care journey' },
  { id: 'clinical', title: 'Records & meds' },
  { id: 'financial', title: 'Billing' },
  { id: 'safety', title: 'Safety' },
  { id: 'account', title: 'Account' },
];

/** Full sidebar hierarchy — maps to App Router under `app/patient/`. */
export const PATIENT_NAV_ITEMS: PatientNavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: PATIENT_ROUTES.dashboard,
    icon: LayoutDashboard,
    mobilePrimary: true,
    section: 'journey',
    description: 'Today’s care snapshot, vitals, and quick actions',
  },
  {
    key: 'appointments',
    label: 'Appointments',
    href: PATIENT_ROUTES.appointments,
    icon: CalendarDays,
    mobilePrimary: true,
    section: 'journey',
    description: 'Book, reschedule, and check in',
  },
  {
    key: 'teleconsult',
    label: 'Teleconsult',
    href: PATIENT_ROUTES.teleconsult,
    icon: Video,
    section: 'journey',
    description: 'Video visits and virtual waiting room',
  },
  {
    key: 'health',
    label: 'My Health',
    href: PATIENT_ROUTES.health,
    icon: HeartPulse,
    mobilePrimary: true,
    section: 'journey',
    description: 'Vitals, wearables, and wellness trends',
  },
  {
    key: 'medications',
    label: 'Medications',
    href: PATIENT_ROUTES.medications,
    icon: Pill,
    section: 'clinical',
    description: 'Adherence tracker and refill requests',
  },
  {
    key: 'prescriptions',
    label: 'Prescriptions',
    href: PATIENT_ROUTES.prescriptions,
    icon: ScrollText,
    section: 'clinical',
    description: 'Active Rx and pharmacy routing',
  },
  {
    key: 'records',
    label: 'Health Records',
    href: PATIENT_ROUTES.records,
    icon: FileStack,
    section: 'clinical',
    description: 'FHIR-aligned EMR · allergies · problem list',
  },
  {
    key: 'diagnostics',
    label: 'Diagnostics',
    href: PATIENT_ROUTES.diagnostics,
    icon: TestTube,
    section: 'clinical',
    description: 'Labs, imaging summaries · DICOM viewer ready',
  },
  {
    key: 'billing',
    label: 'Billing & Insurance',
    href: PATIENT_ROUTES.billing,
    icon: CreditCard,
    section: 'financial',
    description: 'Statements, coverage, and secure pay',
  },
  {
    key: 'communication',
    label: 'Messages',
    href: PATIENT_ROUTES.communication,
    icon: MessageSquare,
    mobilePrimary: true,
    section: 'journey',
    description: 'Care team chat and portal notifications',
  },
  {
    key: 'emergency',
    label: 'Emergency & Family',
    href: PATIENT_ROUTES.emergency,
    icon: ShieldAlert,
    section: 'safety',
    description: 'SOS, ICE contacts, and family proxies',
  },
  {
    key: 'profile',
    label: 'Account & Settings',
    href: PATIENT_ROUTES.profile,
    icon: UserCog,
    mobilePrimary: true,
    section: 'account',
    description: 'MFA, biometrics, profiles, and privacy',
  },
];

export const PATIENT_BRAND = {
  name: 'NEXORA PATIENT',
  icon: HeartHandshake,
  primary: '#f47c8c',
  primaryHover: '#e06373',
  light: '#fde8eb',
  border: '#f0d8dc',
  heading: '#8c2b39',
  muted: '#736366',
  canvas: '#faf6f7',
  emergency: '#e63946',
} as const;

export function isPatientNavActive(pathname: string, href: string): boolean {
  if (href === PATIENT_ROUTES.dashboard) {
    return pathname === PATIENT_ROUTES.dashboard || pathname === `${PATIENT_ROUTES.dashboard}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function patientNavBySection(section: PatientNavItem['section']) {
  return PATIENT_NAV_ITEMS.filter((item) => item.section === section);
}

export function patientMobilePrimaryNav() {
  return PATIENT_NAV_ITEMS.filter((item) => item.mobilePrimary);
}
