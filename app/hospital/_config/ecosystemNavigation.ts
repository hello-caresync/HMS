import type { LucideIcon } from 'lucide-react';

export type EcosystemNavLink = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
};

export type EcosystemNavSection = {
  id: string;
  title: string;
  links: EcosystemNavLink[];
};

export type EcosystemNavLayer = {
  id: string;
  layerLabel: string;
  title: string;
  description: string;
  accentClass: string;
  sections: EcosystemNavSection[];
};

export const HOSPITAL_DASHBOARD_HREF = '/hospital/dashboard';
export const HOSPITAL_LOGIN_HREF = '/hospital/login';

export const ECOSYSTEM_NAV_LAYERS: EcosystemNavLayer[] = [
  {
    id: 'layer-1',
    layerLabel: 'Layer 1',
    title: 'Role Authentication Gateway',
    description: 'Secure access control terminal',
    accentClass: 'text-[#00758C]',
    sections: [
      {
        id: 'l1-auth',
        title: 'Authentication',
        links: [{ id: 'l1-login', label: 'Layer 1 Login Gateway', href: HOSPITAL_LOGIN_HREF }],
      },
    ],
  },
  {
    id: 'layer-2',
    layerLabel: 'Layer 2',
    title: 'Executive Operations Dashboard',
    description: 'Real-time facility command canvas',
    accentClass: 'text-[#00758C]',
    sections: [
      {
        id: 'l2-exec',
        title: 'Command Center',
        links: [{ id: 'l2-dashboard', label: 'Executive Dashboard Canvas', href: HOSPITAL_DASHBOARD_HREF }],
      },
    ],
  },
  {
    id: 'layer-3',
    layerLabel: 'Layer 3',
    title: 'Core Operations Hub',
    description: 'Patient lifecycle & clinical handoffs',
    accentClass: 'text-[#008588]',
    sections: [
      {
        id: 'l3-lifecycle',
        title: 'Lifecycle Processing',
        links: [
          { id: 'l3-patients', label: 'Patient Management', href: '/hospital/patients' },
          { id: 'l3-appointments', label: 'Appointment Scheduling', href: '/hospital/appointments' },
          { id: 'l3-opd', label: 'OPD Consultation', href: '/hospital/opd' },
          { id: 'l3-emr', label: 'EMR Updates', href: '/hospital/emr' },
          { id: 'l3-lab', label: 'Lab Handoff', href: '/hospital/laboratory' },
          { id: 'l3-rad', label: 'Radiology Handoff', href: '/hospital/radiology' },
          { id: 'l3-pharm', label: 'Pharmacy Handoff', href: '/hospital/pharmacy' },
          { id: 'l3-admit', label: 'Inpatient Admission', href: '/hospital/admissions' },
          { id: 'l3-ipd', label: 'IPD Care', href: '/hospital/ipd' },
          { id: 'l3-er', label: 'Emergency', href: '/hospital/emergency' },
          { id: 'l3-ot', label: 'OT Coordination', href: '/hospital/ot' },
          { id: 'l3-discharge', label: 'Patient Discharge', href: '/hospital/discharge' },
          { id: 'l3-billing', label: 'Billing Ledger', href: '/hospital/billing' },
        ],
      },
    ],
  },
  {
    id: 'layer-4',
    layerLabel: 'Layer 4',
    title: 'Clinical Departments',
    description: 'Active functional department spaces',
    accentClass: 'text-[#00A481]',
    sections: [
      {
        id: 'l4-depts',
        title: 'Department Terminals',
        links: [
          { id: 'l4-opd', label: 'OPD Clinics', href: '/hospital/departments/opd' },
          { id: 'l4-lab', label: 'Laboratory Registry', href: '/hospital/departments/laboratory' },
          { id: 'l4-rad', label: 'Radiology Scanning Terminal', href: '/hospital/departments/radiology' },
          { id: 'l4-pharm', label: 'Pharmacy Inventory', href: '/hospital/departments/pharmacy' },
          { id: 'l4-emr', label: 'Unified EMR Vault', href: '/hospital/departments/emr-vault' },
        ],
      },
    ],
  },
  {
    id: 'layer-5',
    layerLabel: 'Layer 5',
    title: 'Integrated Billing Flow',
    description: 'Itemized charges & payment release',
    accentClass: 'text-[#00A481]',
    sections: [
      {
        id: 'l5-charges',
        title: 'Charge Ledgers',
        links: [
          { id: 'l5-opd', label: 'OPD Charges', href: '/hospital/billing/opd-charges' },
          { id: 'l5-lab', label: 'Lab Charges', href: '/hospital/billing/lab-charges' },
          { id: 'l5-rad', label: 'Radiology Charges', href: '/hospital/billing/radiology-charges' },
          { id: 'l5-med', label: 'Medicine Charges', href: '/hospital/billing/medicine-charges' },
          { id: 'l5-adm', label: 'Admission Charges', href: '/hospital/billing/admission-charges' },
          { id: 'l5-ot', label: 'OT Charges', href: '/hospital/billing/ot-charges' },
        ],
      },
      {
        id: 'l5-settlement',
        title: 'Settlement Pipeline',
        links: [
          { id: 'l5-inv', label: 'Final Invoice Generation', href: '/hospital/billing/invoices' },
          { id: 'l5-pay', label: 'Payment Gateway Status', href: '/hospital/payments' },
          { id: 'l5-rcpt', label: 'Receipt Release', href: '/hospital/billing/receipts' },
          { id: 'l5-ins', label: 'Insurance & TPA', href: '/hospital/insurance' },
        ],
      },
    ],
  },
  {
    id: 'layer-6',
    layerLabel: 'Layer 6',
    title: 'Staff & Human Capital',
    description: 'Workforce matrices & permissions',
    accentClass: 'text-[#008588]',
    sections: [
      {
        id: 'l6-hcm',
        title: 'Human Capital Management',
        links: [
          { id: 'l6-dir', label: 'Staff Directory', href: '/hospital/staff' },
          { id: 'l6-emp', label: 'Employee Details Ledger', href: '/hospital/staff/employees' },
          { id: 'l6-dept', label: 'Departmental Breakdown', href: '/hospital/staff/departments' },
          { id: 'l6-shift', label: 'Shift Management', href: '/hospital/staff/shifts' },
          { id: 'l6-att', label: 'Attendance Sheets', href: '/hospital/staff/attendance' },
          { id: 'l6-rbac', label: 'Role Permissions', href: '/hospital/staff/roles' },
        ],
      },
    ],
  },
  {
    id: 'doctor-portal',
    layerLabel: 'Sub-App',
    title: 'Doctor App Portal',
    description: 'Physician clinical workspace',
    accentClass: 'text-[#008588]',
    sections: [
      {
        id: 'doc-core',
        title: 'Clinical Workspace',
        links: [
          { id: 'doc-dash', label: 'Doctor Dashboard', href: '/doctor/dashboard', external: true },
          { id: 'doc-appt', label: 'Appointments Management', href: '/doctor/scheduler', external: true },
          { id: 'doc-list', label: 'Patient List', href: '/doctor/emr-vault', external: true },
          { id: 'doc-consult', label: 'Clinical Consultation', href: '/doctor/consultation', external: true },
          { id: 'doc-emr', label: 'EMR View', href: '/doctor/emr-vault', external: true },
          { id: 'doc-lab', label: 'Laboratory Ordering', href: '/doctor/labs', external: true },
          { id: 'doc-rad', label: 'Radiology Ordering', href: '/doctor/radiology', external: true },
          { id: 'doc-rx', label: 'e-Prescription Desk', href: '/prescription', external: true },
          { id: 'doc-admit', label: 'Admission Trigger', href: '/doctor/consultation', external: true },
          { id: 'doc-profile', label: 'Doctor Profile & Schedule', href: '/doctor/dashboard', external: true },
        ],
      },
    ],
  },
  {
    id: 'patient-portal',
    layerLabel: 'Sub-App',
    title: 'Patient App Portal',
    description: 'Consumer care & engagement deck',
    accentClass: 'text-[#00A481]',
    sections: [
      {
        id: 'pat-core',
        title: 'Patient Experience',
        links: [
          { id: 'pat-dash', label: 'Patient Dashboard', href: '/patient/dashboard', external: true },
          { id: 'pat-book', label: 'Appointment Booking', href: '/patient/appointments', external: true },
          { id: 'pat-records', label: 'Medical Records History', href: '/patient/health', external: true },
          { id: 'pat-rx', label: 'Active Prescriptions', href: '/patient/medications', external: true },
          { id: 'pat-labs', label: 'Lab & Radiology Reports', href: '/patient/diagnostics', external: true },
          { id: 'pat-bill', label: 'Billing & Online Payment', href: '/patient/billing', external: true },
          { id: 'pat-notify', label: 'Notification Stream', href: '/patient/communication', external: true },
          { id: 'pat-tele', label: 'Teleconsultation Interface', href: '/patient/teleconsult', external: true },
          { id: 'pat-profile', label: 'Profile Management', href: '/patient/profile', external: true },
        ],
      },
    ],
  },
  {
    id: 'vendor-portal',
    layerLabel: 'Sub-App',
    title: 'Vendor App Portal',
    description: 'Secure supplier & procurement terminal',
    accentClass: 'text-[#5EC283]',
    sections: [
      {
        id: 'vnd-core',
        title: 'Supplier Operations',
        links: [
          { id: 'vnd-dash', label: 'Procurement Dashboard', href: '/vendor', external: true },
          { id: 'vnd-po', label: 'Purchase Orders Workflow', href: '/vendor/secure-hub/po-inbox', external: true },
          { id: 'vnd-del', label: 'Delivery Management', href: '/vendor/secure-hub?module=logistics', external: true },
          { id: 'vnd-inv', label: 'Inventory & Stock Monitor', href: '/vendor/secure-hub?module=catalog', external: true },
          { id: 'vnd-cat', label: 'Product Catalog', href: '/vendor/secure-hub?module=catalog', external: true },
          { id: 'vnd-inv-mgmt', label: 'Invoice Management (GST)', href: '/vendor/secure-hub?module=billing', external: true },
          { id: 'vnd-pay', label: 'Payment Tracker', href: '/vendor/secure-hub?module=analytics', external: true },
          { id: 'vnd-svc', label: 'Maintenance & Service Desk', href: '/vendor/secure-hub?module=documents', external: true },
          { id: 'vnd-ret', label: 'Returns & Replacements', href: '/vendor/secure-hub?module=returns', external: true },
          { id: 'vnd-com', label: 'Communication Center', href: '/vendor/secure-hub?module=communication', external: true },
        ],
      },
    ],
  },
];

/** Icon map keyed by nav link id — keeps href data separate from Lucide imports */
export const NAV_LINK_ICON_IDS: Record<string, string> = {
  'l1-login': 'shield',
  'l2-dashboard': 'layout',
  'l3-patients': 'users',
  'l3-appointments': 'calendar',
  'l3-opd': 'clipboard',
  'l3-emr': 'file',
  'l3-lab': 'flask',
  'l3-rad': 'scan',
  'l3-pharm': 'pill',
  'l3-admit': 'bed',
  'l3-ipd': 'activity',
  'l3-er': 'alert',
  'l3-ot': 'scissors',
  'l3-discharge': 'logout',
  'l3-billing': 'receipt',
  'l4-opd': 'clipboard',
  'l4-lab': 'flask',
  'l4-rad': 'scan',
  'l4-pharm': 'pill',
  'l4-emr': 'folder',
  'l5-opd': 'receipt',
  'l5-lab': 'flask',
  'l5-rad': 'scan',
  'l5-med': 'pill',
  'l5-adm': 'bed',
  'l5-ot': 'scissors',
  'l5-inv': 'file',
  'l5-pay': 'wallet',
  'l5-rcpt': 'receipt',
  'l5-ins': 'credit',
  'l6-dir': 'usercheck',
  'l6-emp': 'users',
  'l6-dept': 'building',
  'l6-shift': 'calendar',
  'l6-att': 'clock',
  'l6-rbac': 'shield',
  'doc-dash': 'layout',
  'doc-appt': 'calendar',
  'doc-list': 'users',
  'doc-consult': 'stethoscope',
  'doc-emr': 'folder',
  'doc-lab': 'flask',
  'doc-rad': 'scan',
  'doc-rx': 'file',
  'doc-admit': 'bed',
  'doc-profile': 'usercheck',
  'pat-dash': 'layout',
  'pat-book': 'calendar',
  'pat-records': 'heart',
  'pat-rx': 'pill',
  'pat-labs': 'flask',
  'pat-bill': 'receipt',
  'pat-notify': 'bell',
  'pat-tele': 'video',
  'pat-profile': 'usercheck',
  'vnd-dash': 'layout',
  'vnd-po': 'file',
  'vnd-del': 'truck',
  'vnd-inv': 'package',
  'vnd-cat': 'package',
  'vnd-inv-mgmt': 'receipt',
  'vnd-pay': 'wallet',
  'vnd-svc': 'wrench',
  'vnd-ret': 'rotate',
  'vnd-com': 'message',
};

export type IconResolver = (iconId: string) => LucideIcon;

export function isHospitalNavActive(pathname: string, href: string): boolean {
  if (href === HOSPITAL_DASHBOARD_HREF) {
    return pathname === HOSPITAL_DASHBOARD_HREF || pathname === `${HOSPITAL_DASHBOARD_HREF}/`;
  }
  if (href === HOSPITAL_LOGIN_HREF) {
    return pathname === HOSPITAL_LOGIN_HREF || pathname === `${HOSPITAL_LOGIN_HREF}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isAuthRoute(pathname: string): boolean {
  return pathname === HOSPITAL_LOGIN_HREF || pathname === `${HOSPITAL_LOGIN_HREF}/`;
}

export function isStandaloneShellRoute(pathname: string): boolean {
  return (
    isAuthRoute(pathname) ||
    pathname === HOSPITAL_DASHBOARD_HREF ||
    pathname === `${HOSPITAL_DASHBOARD_HREF}/`
  );
}

export function shouldRedirectToHospitalDashboard(pathname: string): boolean {
  return pathname === '/hospital' || pathname === '/hospital/';
}
