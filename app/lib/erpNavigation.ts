import { APP_ROUTES } from './routes';

export type ErpNavItem = {
  label: string;
  href: string;
  description?: string;
};

export type ErpNavSection = {
  id: string;
  title: string;
  items: ErpNavItem[];
};

/** ERP navigation registry — Phases 1–7 */
export const ERP_NAV_SECTIONS: ErpNavSection[] = [
  {
    id: 'core',
    title: 'Core Operations',
    items: [
      { label: 'Dashboard', href: APP_ROUTES.hospitalDashboard, description: 'Executive command cockpit' },
      { label: 'Patients', href: APP_ROUTES.patientsRegister, description: 'Unified registration desk' },
      { label: 'Appointments', href: APP_ROUTES.appointmentsHub, description: 'Token queue & walk-in desk' },
      { label: 'Admissions', href: APP_ROUTES.admissionsAllocate, description: 'Bed matrix & allocation' },
      { label: 'Staff Directory', href: APP_ROUTES.staffDirectory, description: 'HR profiles & roles' },
    ],
  },
  {
    id: 'clinical',
    title: 'Clinical Units',
    items: [
      { label: 'Doctor Dashboard', href: APP_ROUTES.doctorDashboard, description: 'Clinical workspace & OPD queue' },
      { label: 'OPD', href: APP_ROUTES.opd, description: 'Outpatient operations' },
      { label: 'IPD', href: APP_ROUTES.ipdManagement, description: 'Nursing dashboard & MAR charting' },
      { label: 'Emergency', href: APP_ROUTES.emergency, description: 'Trauma triage monitor' },
      { label: 'OT Coordination', href: APP_ROUTES.otCoordination, description: 'Theater schedule & safety' },
      { label: 'EMR', href: APP_ROUTES.emr, description: 'Clinical charting workbench' },
      { label: 'Laboratory', href: APP_ROUTES.laboratoryHub, description: 'Sample processing workbench' },
      { label: 'Radiology', href: APP_ROUTES.radiologyHub, description: 'Imaging session control' },
      { label: 'Pharmacy', href: APP_ROUTES.pharmacyHub, description: 'Fulfillment & checkout counter' },
    ],
  },
  {
    id: 'backoffice',
    title: 'Back Office',
    items: [
      { label: 'Billing', href: APP_ROUTES.billingHub, description: 'Invoice builder & GST ledger' },
      { label: 'Payments', href: APP_ROUTES.paymentsHub, description: 'Cashier & split-payment desk' },
      { label: 'Insurance & TPA', href: APP_ROUTES.insuranceTpa, description: 'Pre-auth & claims tracker' },
      { label: 'Inventory', href: APP_ROUTES.inventoryHub, description: 'Stock matrix & expiry watch' },
      { label: 'Procurement', href: APP_ROUTES.procurementHub, description: 'PO pipeline & GRN validation' },
      { label: 'Vendor Coordination', href: APP_ROUTES.vendorCoordination, description: 'Supplier agreements desk' },
      { label: 'Finance', href: APP_ROUTES.finance, description: 'GST ledger simulation desk' },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    items: [
      { label: 'HR', href: APP_ROUTES.hrHub, description: 'Workforce roster & shifts' },
      { label: 'Asset Management', href: APP_ROUTES.assetsHub, description: 'Equipment & AMC ledger' },
      { label: 'Reports', href: APP_ROUTES.reportsHub, description: 'Executive analytics cockpit' },
      { label: 'Security Audit', href: APP_ROUTES.adminAudit, description: 'Immutable audit trail' },
      { label: 'System Settings', href: APP_ROUTES.adminSettings, description: 'IT security controls' },
      { label: 'Hospital Settings', href: APP_ROUTES.settingsHub, description: 'RBAC · backup · API sandbox' },
    ],
  },
];

export const ERP_MODULE_COUNT = ERP_NAV_SECTIONS.reduce(
  (sum, section) => sum + section.items.length,
  0,
);

/** Routes that render without the ERP sidebar (auth & external portals) */
export const BARE_LAYOUT_PREFIXES = [
  '/login',
  '/vendor',
  '/patient',
  '/hospital',
  '/doctor',
  '/clinical',
  '/dashboard',
  '/appointments',
  '/consultation',
  '/emr',
  '/prescription',
  '/laboratory',
  '/radiology',
  '/surgery',
  '/telemedicine',
  '/clinical-suite',
  '/practice-hub',
  '/settings',
  '/messaging',
  '/documents',
];

export function usesBareLayout(pathname: string): boolean {
  return BARE_LAYOUT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
