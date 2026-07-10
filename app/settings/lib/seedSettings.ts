import type {
  ConfigAuditEntry,
  DepartmentConfig,
  HospitalProfile,
  InsuranceProvider,
  NotificationChannel,
  PackageConfig,
  RolePermissionMap,
  ServiceConfig,
  SystemRole,
  TaxStructure,
} from '../types';

export const SEED_HOSPITAL_PROFILE: HospitalProfile = {
  name: 'Nexora Multi-Specialty Hospital',
  legalName: 'Nexora Healthcare Pvt. Ltd.',
  registrationNo: 'MH-HOS-2019-4482',
  address: 'Plot 12, Healthcare District, Pune, Maharashtra 411001',
  phone: '+91 20 4521 8800',
  email: 'admin@nexora.health',
  timezone: 'Asia/Kolkata (IST)',
};

export const SEED_DEPARTMENTS: DepartmentConfig[] = [
  { id: 'dept-1', name: 'Intensive Care Unit', code: 'ICU', head: 'Dr. Priya Nair', active: true },
  { id: 'dept-2', name: 'Radiology', code: 'RAD', head: 'Dr. Arjun Mehta', active: true },
  { id: 'dept-3', name: 'Laboratory', code: 'LAB', head: 'Dr. Kavita Rao', active: true },
  { id: 'dept-4', name: 'Pharmacy', code: 'PHR', head: 'Rahul Deshmukh', active: true },
  { id: 'dept-5', name: 'General Surgery', code: 'SUR', head: 'Dr. Vikram Singh', active: true },
  { id: 'dept-6', name: 'Emergency', code: 'ER', head: 'Dr. Ananya Patel', active: true },
];

export const SEED_TAX_STRUCTURES: TaxStructure[] = [
  { id: 'tax-1', name: 'GST @ 5%', ratePercent: 5, active: true },
  { id: 'tax-2', name: 'GST @ 12%', ratePercent: 12, active: true },
  { id: 'tax-3', name: 'GST @ 18%', ratePercent: 18, active: true },
  { id: 'tax-4', name: 'Tax Exempt', ratePercent: 0, active: true },
];

export const SEED_SERVICES: ServiceConfig[] = [
  {
    id: 'svc-1',
    name: 'General OPD Consultation',
    department: 'General Medicine',
    baseFee: 800,
    taxStructureId: 'tax-1',
  },
  {
    id: 'svc-2',
    name: 'Chest X-Ray (PA View)',
    department: 'Radiology',
    baseFee: 650,
    taxStructureId: 'tax-2',
  },
  {
    id: 'svc-3',
    name: 'Complete Blood Count',
    department: 'Laboratory',
    baseFee: 450,
    taxStructureId: 'tax-2',
  },
  {
    id: 'svc-4',
    name: 'ICU Bed (Per Day)',
    department: 'Intensive Care Unit',
    baseFee: 18500,
    taxStructureId: 'tax-3',
  },
  {
    id: 'svc-5',
    name: 'Emergency Triage',
    department: 'Emergency',
    baseFee: 1200,
    taxStructureId: 'tax-4',
  },
];

export const SEED_PACKAGES: PackageConfig[] = [
  {
    id: 'pkg-1',
    name: 'Executive Health Checkup',
    serviceIds: ['svc-3'],
    bundlePrice: 4999,
    active: true,
  },
  {
    id: 'pkg-2',
    name: 'Maternity Care Bundle',
    serviceIds: ['svc-1'],
    bundlePrice: 45000,
    active: true,
  },
];

export const SEED_INSURANCE: InsuranceProvider[] = [
  { id: 'ins-1', name: 'Star Health Insurance', tpaCode: 'STAR-TPA-001', active: true },
  { id: 'ins-2', name: 'ICICI Lombard', tpaCode: 'ICICI-TPA-042', active: true },
  { id: 'ins-3', name: 'Medi Assist TPA', tpaCode: 'MA-TPA-118', active: false },
];

export const SEED_ROLES: SystemRole[] = [
  { id: 'role-admin', name: 'Administrator', description: 'Full system access' },
  { id: 'role-doctor', name: 'Doctor', description: 'Clinical EMR and prescriptions' },
  { id: 'role-nurse', name: 'Nurse', description: 'Patient care and vitals' },
  { id: 'role-pharmacist', name: 'Pharmacist', description: 'Pharmacy dispensing' },
  { id: 'role-lab', name: 'Lab Technician', description: 'Lab orders and results' },
  { id: 'role-reception', name: 'Receptionist', description: 'Front desk operations' },
  { id: 'role-store', name: 'Store Manager', description: 'Inventory and procurement' },
  { id: 'role-hr', name: 'HR Manager', description: 'Workforce administration' },
];

export const SEED_PERMISSIONS: RolePermissionMap = {
  'role-admin': {
    readEmr: true,
    writePrescriptions: true,
    overrideInvoices: true,
    manageInventory: true,
    approvePurchaseOrders: true,
    accessAuditLogs: true,
  },
  'role-doctor': {
    readEmr: true,
    writePrescriptions: true,
    overrideInvoices: false,
    manageInventory: false,
    approvePurchaseOrders: false,
    accessAuditLogs: false,
  },
  'role-nurse': {
    readEmr: true,
    writePrescriptions: false,
    overrideInvoices: false,
    manageInventory: false,
    approvePurchaseOrders: false,
    accessAuditLogs: false,
  },
  'role-pharmacist': {
    readEmr: true,
    writePrescriptions: false,
    overrideInvoices: false,
    manageInventory: true,
    approvePurchaseOrders: false,
    accessAuditLogs: false,
  },
  'role-lab': {
    readEmr: true,
    writePrescriptions: false,
    overrideInvoices: false,
    manageInventory: false,
    approvePurchaseOrders: false,
    accessAuditLogs: false,
  },
  'role-reception': {
    readEmr: false,
    writePrescriptions: false,
    overrideInvoices: false,
    manageInventory: false,
    approvePurchaseOrders: false,
    accessAuditLogs: false,
  },
  'role-store': {
    readEmr: false,
    writePrescriptions: false,
    overrideInvoices: false,
    manageInventory: true,
    approvePurchaseOrders: true,
    accessAuditLogs: false,
  },
  'role-hr': {
    readEmr: false,
    writePrescriptions: false,
    overrideInvoices: false,
    manageInventory: false,
    approvePurchaseOrders: false,
    accessAuditLogs: true,
  },
};

export const SEED_NOTIFICATIONS: NotificationChannel[] = [
  { id: 'notif-1', label: 'Critical Lab Values', email: true, sms: true, inApp: true },
  { id: 'notif-2', label: 'Low Stock Alerts', email: true, sms: false, inApp: true },
  { id: 'notif-3', label: 'Invoice Overrides', email: true, sms: true, inApp: true },
  { id: 'notif-4', label: 'Equipment Breakdown', email: false, sms: true, inApp: true },
  { id: 'notif-5', label: 'Payroll Disbursement', email: true, sms: false, inApp: false },
];

export const SEED_CONFIG_AUDIT: ConfigAuditEntry[] = [
  {
    id: 'cfg-aud-1',
    timestamp: '2026-07-09T15:42:00.000Z',
    userId: 'USR-ADM-0041',
    panel: 'Roles & Permissions',
    action: 'Updated Pharmacist inventory access',
  },
  {
    id: 'cfg-aud-2',
    timestamp: '2026-07-09T14:18:00.000Z',
    userId: 'USR-ADM-0041',
    panel: 'Taxes',
    action: 'Activated GST @ 18%',
  },
  {
    id: 'cfg-aud-3',
    timestamp: '2026-07-08T11:05:00.000Z',
    userId: 'USR-ADM-0022',
    panel: 'Services',
    action: 'Added ICU Bed (Per Day) service',
  },
];

export const DEPARTMENT_OPTIONS = [
  'General Medicine',
  'Radiology',
  'Laboratory',
  'Intensive Care Unit',
  'Emergency',
  'General Surgery',
  'Cardiology',
  'Orthopedics',
];
