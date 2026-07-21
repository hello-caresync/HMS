import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  Calendar,
  CalendarClock,
  FileText,
  FlaskConical,
  LayoutDashboard,
  MessageSquare,
  Pill,
  ScanLine,
  Scissors,
  Settings,
  ShieldAlert,
  Stethoscope,
  Users,
  Video,
} from 'lucide-react';

export type DoctorNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const DOCTOR_SIDEBAR_NAV: DoctorNavItem[] = [
  { label: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
  { label: 'My Schedule', href: '/doctor/schedule', icon: CalendarClock },
  { label: 'My Patients', href: '/doctor/patients', icon: Users },
  { label: 'OPD Consultation', href: '/doctor/opd', icon: Stethoscope },
  { label: 'IPD Management', href: '/doctor/ipd', icon: Activity },
  { label: 'Emergency Cases', href: '/doctor/emergency', icon: ShieldAlert },
  { label: 'EMR', href: '/doctor/emr', icon: FileText },
  { label: 'e-Prescription', href: '/doctor/prescriptions', icon: Pill },
  { label: 'Laboratory Orders', href: '/doctor/lab', icon: FlaskConical },
  { label: 'Radiology Orders', href: '/doctor/radiology', icon: ScanLine },
  { label: 'Surgery Management', href: '/doctor/surgeries', icon: Scissors },
  { label: 'Telemedicine', href: '/doctor/telemedicine', icon: Video },
  { label: 'Clinical Documents', href: '/doctor/documents', icon: FileText },
  { label: 'AI Clinical Assistant', href: '/doctor/ai-assistant', icon: Brain },
  { label: 'Communication Center', href: '/doctor/messages', icon: MessageSquare },
  { label: 'Notifications', href: '/doctor/notifications', icon: Bell },
  { label: 'Calendar', href: '/doctor/calendar', icon: Calendar },
  { label: 'Reports & Analytics', href: '/doctor/analytics', icon: BarChart3 },
  { label: 'Profile & Settings', href: '/doctor/settings', icon: Settings },
];

export function isDoctorNavActive(pathname: string, href: string): boolean {
  const aliases: Record<string, string[]> = {
    '/doctor/schedule': ['/doctor/schedule', '/doctor/scheduler'],
    '/doctor/opd': ['/doctor/opd', '/doctor/consultation'],
    '/doctor/emr': ['/doctor/emr', '/doctor/emr-vault'],
    '/doctor/lab': ['/doctor/lab', '/doctor/labs'],
    '/doctor/telemedicine': ['/doctor/telemedicine', '/doctor/telehealth'],
  };
  const paths = aliases[href] ?? [href];
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
