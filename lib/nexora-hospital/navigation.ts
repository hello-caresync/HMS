import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Building2,
  Calendar,
  LayoutDashboard,
  Package,
  Settings,
  Stethoscope,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';

export type HospitalModuleId =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'opd'
  | 'admissions'
  | 'billing'
  | 'inventory'
  | 'vendors'
  | 'notifications'
  | 'settings';

export type HospitalNavItem = {
  id: HospitalModuleId;
  label: string;
  emoji: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

/** Enterprise Operations Hub — 10 locked routes under /hospital/* */
export const HOSPITAL_NAV: HospitalNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    emoji: '🏠',
    href: '/hospital/dashboard',
    icon: LayoutDashboard,
    description: 'Operational command center',
  },
  {
    id: 'patients',
    label: 'Patients',
    emoji: '👥',
    href: '/hospital/patients',
    icon: Users,
    description: 'Patient registry & profiles',
  },
  {
    id: 'appointments',
    label: 'Appointments',
    emoji: '📅',
    href: '/hospital/appointments',
    icon: Calendar,
    description: 'Scheduling & calendar',
  },
  {
    id: 'opd',
    label: 'OPD Queue',
    emoji: '🩺',
    href: '/hospital/opd-queue',
    icon: Stethoscope,
    description: 'Live outpatient queue',
  },
  {
    id: 'admissions',
    label: 'Admissions',
    emoji: '🛏',
    href: '/hospital/admissions',
    icon: Building2,
    description: 'Inpatient admissions & beds',
  },
  {
    id: 'billing',
    label: 'Billing',
    emoji: '💳',
    href: '/hospital/billing',
    icon: Wallet,
    description: 'Revenue & payments',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    emoji: '📦',
    href: '/hospital/inventory',
    icon: Package,
    description: 'Pharmacy & consumables stock',
  },
  {
    id: 'vendors',
    label: 'Vendors',
    emoji: '🚚',
    href: '/hospital/vendors',
    icon: Truck,
    description: 'Purchase orders & deliveries',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    emoji: '🔔',
    href: '/hospital/notifications',
    icon: Bell,
    description: 'Live audit feed',
  },
  {
    id: 'settings',
    label: 'Settings',
    emoji: '⚙',
    href: '/hospital/settings',
    icon: Settings,
    description: 'Hospital configuration & RBAC',
  },
];

const ENTERPRISE_PREFIXES = HOSPITAL_NAV.map((n) => n.href);

/** Legacy /dashboard/* routes still supported for bookmarks */
const LEGACY_DASHBOARD_MAP: Record<string, string> = {
  '/dashboard': '/hospital/dashboard',
  '/dashboard/patients': '/hospital/patients',
  '/dashboard/appointments': '/hospital/appointments',
  '/dashboard/opd': '/hospital/opd-queue',
  '/dashboard/admissions': '/hospital/admissions',
  '/dashboard/billing': '/hospital/billing',
  '/dashboard/inventory': '/hospital/inventory',
  '/dashboard/vendors': '/hospital/vendors',
  '/dashboard/notifications': '/hospital/notifications',
  '/dashboard/settings': '/hospital/settings',
};

export function isHospitalShellRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/hospital/login') return false;
  if (ENTERPRISE_PREFIXES.includes(pathname)) {
    return true;
  }
  if (pathname === '/hospital/opd') return true;
  if (pathname in LEGACY_DASHBOARD_MAP) return true;
  if (pathname.startsWith('/dashboard/') && Object.keys(LEGACY_DASHBOARD_MAP).some((k) => pathname.startsWith(k))) {
    return true;
  }
  return pathname === '/dashboard';
}

export function hospitalModuleFromPath(pathname: string | null): HospitalModuleId {
  if (!pathname) return 'dashboard';
  if (pathname === '/hospital/opd') return 'opd';
  const match = HOSPITAL_NAV.find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`),
  );
  if (match) return match.id;
  const legacy = Object.entries(LEGACY_DASHBOARD_MAP).find(([k]) => pathname === k || pathname.startsWith(k));
  if (legacy) {
    const target = HOSPITAL_NAV.find((n) => n.href === legacy[1]);
    return target?.id ?? 'dashboard';
  }
  return 'dashboard';
}

export function hospitalHref(moduleId: HospitalModuleId): string {
  return HOSPITAL_NAV.find((n) => n.id === moduleId)?.href ?? '/hospital/dashboard';
}
