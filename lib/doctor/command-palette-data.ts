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
  Siren,
  Stethoscope,
  Users,
  Video,
  Zap,
} from 'lucide-react';

import { CLINICAL_SIDEBAR_NAV } from '@/lib/doctor-os/clinical-navigation';

export type CommandPaletteItem = {
  id: string;
  label: string;
  description?: string;
  href?: string;
  action?: 'ai' | 'notifications';
  icon: LucideIcon;
  keywords?: string[];
  group: 'Navigate' | 'Patients' | 'Clinical' | 'Actions' | 'System';
};

const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  schedule: CalendarDays,
  patients: Users,
  opd: Stethoscope,
  ipd: Activity,
  emergency: Siren,
  emr: FileText,
  eprescription: Pill,
  lab: FlaskConical,
  radiology: ScanLine,
  surgery: Scissors,
  telemedicine: Video,
  documents: ClipboardList,
  ai: Bot,
  communication: MessageSquare,
  notifications: Bell,
  calendar: CalendarDays,
  reports: BarChart3,
  profile: Settings,
};

export const COMMAND_PALETTE_ITEMS: CommandPaletteItem[] = [
  ...CLINICAL_SIDEBAR_NAV.map((item) => ({
    id: `nav-${item.id}`,
    label: item.label,
    href: item.href,
    icon: NAV_ICONS[item.id] ?? item.icon,
    group: 'Navigate' as const,
  })),
  {
    id: 'act-consult',
    label: 'Start OPD consultation',
    href: '/doctor/opd-consultation',
    icon: Stethoscope,
    group: 'Clinical',
    keywords: ['consult', 'opd', 'queue'],
  },
  {
    id: 'act-rx',
    label: 'Write e-Prescription',
    href: '/doctor/e-prescription',
    icon: Pill,
    group: 'Clinical',
    keywords: ['prescription', 'medication'],
  },
  {
    id: 'act-search',
    label: 'Search patients',
    href: '/doctor/patients',
    icon: Users,
    group: 'Patients',
    keywords: ['emr', 'records'],
  },
  {
    id: 'ai-open',
    label: 'AI Clinical Copilot',
    action: 'ai' as const,
    icon: Zap,
    group: 'Actions',
    keywords: ['assistant', 'differential'],
  },
  {
    id: 'notif-open',
    label: 'Notifications',
    action: 'notifications' as const,
    icon: Bell,
    group: 'System',
  },
];
