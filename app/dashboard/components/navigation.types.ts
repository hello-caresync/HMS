import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BedDouble,
  Building2,
  Calendar,
  Cog,
  Database,
  DollarSign,
  FileText,
  FlaskConical,
  Handshake,
  LayoutDashboard,
  Monitor,
  Package,
  Pill,
  ScanLine,
  Scissors,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Stethoscope,
  UserCog,
  Users,
  Workflow,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Optional keyboard shortcut hint for tooltips */
  shortcut?: string;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  /** Expanded by default on first mount */
  defaultOpen?: boolean;
}

export const NEXORA_HMS_NAV: NavSection[] = [
  {
    id: 'core-operations',
    title: 'Core Operations',
    defaultOpen: true,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'hp-workspace', label: 'HP Workspace', icon: Workflow, shortcut: 'Professional Console' },
      { id: 'patients', label: 'Patients', icon: Users },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      { id: 'admissions', label: 'Admissions', icon: Building2 },
      { id: 'staff-directory', label: 'Staff Directory', icon: UserCog },
    ],
  },
  {
    id: 'clinical-workflows',
    title: 'Clinical Workflows',
    defaultOpen: true,
    items: [
      { id: 'opd', label: 'OPD', icon: Stethoscope, shortcut: 'Outpatient' },
      { id: 'ipd', label: 'IPD', icon: BedDouble, shortcut: 'Inpatient' },
      { id: 'emergency', label: 'Emergency', icon: ShieldAlert },
      { id: 'ot', label: 'OT Coordination', icon: Scissors },
      { id: 'emr', label: 'EMR', icon: FileText },
    ],
  },
  {
    id: 'ancillary-services',
    title: 'Ancillary Services',
    defaultOpen: true,
    items: [
      { id: 'laboratory', label: 'Laboratory', icon: FlaskConical },
      { id: 'radiology', label: 'Radiology', icon: ScanLine },
      { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
    ],
  },
  {
    id: 'supply-chain',
    title: 'Supply Chain & Vendors',
    defaultOpen: false,
    items: [
      { id: 'inventory', label: 'Inventory', icon: Package },
      { id: 'procurement', label: 'Procurement', icon: ShoppingCart },
      { id: 'vendor-coordination', label: 'Vendor Coordination', icon: Handshake },
    ],
  },
  {
    id: 'enterprise-finance',
    title: 'Enterprise & Finance',
    defaultOpen: false,
    items: [
      { id: 'billing', label: 'Billing & Finance', icon: DollarSign },
      { id: 'hr-workforce', label: 'HR & Workforce', icon: Users },
      { id: 'assets', label: 'Asset Management', icon: Monitor },
      { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'system-controls',
    title: 'System Controls',
    defaultOpen: false,
    items: [
      { id: 'master-data', label: 'Master Data', icon: Database },
      { id: 'administration', label: 'Administration', icon: Settings },
      { id: 'settings', label: 'Settings', icon: Cog },
    ],
  },
];

export type NexoraSidebarUser = {
  name: string;
  role: string;
  initials?: string;
};
