export type SettingsCategory = 'organization' | 'financials' | 'security';

export type SettingsPanel =
  | 'hospital-profile'
  | 'departments'
  | 'taxes'
  | 'services'
  | 'packages'
  | 'insurance'
  | 'roles-permissions'
  | 'notifications'
  | 'audit-logs';

export type PermissionKey =
  | 'readEmr'
  | 'writePrescriptions'
  | 'overrideInvoices'
  | 'manageInventory'
  | 'approvePurchaseOrders'
  | 'accessAuditLogs';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  sensitive?: boolean;
}

export interface SystemRole {
  id: string;
  name: string;
  description: string;
}

export interface RolePermissionMap {
  [roleId: string]: Record<PermissionKey, boolean>;
}

export interface TaxStructure {
  id: string;
  name: string;
  ratePercent: number;
  active: boolean;
}

export interface ServiceConfig {
  id: string;
  name: string;
  department: string;
  baseFee: number;
  taxStructureId: string;
}

export interface PackageConfig {
  id: string;
  name: string;
  serviceIds: string[];
  bundlePrice: number;
  active: boolean;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  tpaCode: string;
  active: boolean;
}

export interface DepartmentConfig {
  id: string;
  name: string;
  code: string;
  head: string;
  active: boolean;
}

export interface HospitalProfile {
  name: string;
  legalName: string;
  registrationNo: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
}

export interface NotificationChannel {
  id: string;
  label: string;
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

export interface ConfigAuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  panel: string;
  action: string;
}

export interface SettingsToast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { key: 'readEmr', label: 'Read EMR' },
  { key: 'writePrescriptions', label: 'Write Prescriptions' },
  { key: 'overrideInvoices', label: 'Override Invoices', sensitive: true },
  { key: 'manageInventory', label: 'Manage Inventory' },
  { key: 'approvePurchaseOrders', label: 'Approve POs', sensitive: true },
  { key: 'accessAuditLogs', label: 'Access Audit Logs', sensitive: true },
];

export const PANEL_LABELS: Record<SettingsPanel, string> = {
  'hospital-profile': 'Hospital Profile',
  departments: 'Departments',
  taxes: 'Taxes',
  services: 'Services',
  packages: 'Packages',
  insurance: 'Insurance',
  'roles-permissions': 'Roles & Permissions',
  notifications: 'Notification Settings',
  'audit-logs': 'Audit Logs',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateConfigId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}
