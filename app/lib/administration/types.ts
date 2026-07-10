/** Phase 7 — Administration workflow types (Modules 20–25) */

export type ReportDepartmentFilter =
  | 'All Departments'
  | 'Radiology'
  | 'Laboratory'
  | 'Procurement'
  | 'Pharmacy'
  | 'Billing';

export interface ExecutiveMetricCard {
  id: string;
  label: string;
  value: string;
  subtext: string;
  trendLabel?: string;
}

export interface DepartmentFinancialRow {
  department: string;
  revenue: number;
  expenses: number;
  netMargin: number;
  transactionCount: number;
}

export type EquipmentStatus = 'Operational' | 'Needs Calibration' | 'Under Repair';

export interface MedicalAssetRecord {
  assetId: string;
  equipmentName: string;
  roomLocator: string;
  status: EquipmentStatus;
  warrantyExpiration: string;
  amcProvider: string;
  amcContact: string;
}

export interface MaintenanceRequestDraft {
  assetId: string;
  equipmentName: string;
  issueDescription: string;
}

export type AuditStatusTag = 'AUTHORIZED' | 'MFA_CHALLENGE' | 'CRITICAL_BYPASS';

export interface SecurityAuditLogEntry {
  id: string;
  timestamp: string;
  employeeId: string;
  performedAction: string;
  ipAddress: string;
  statusTag: AuditStatusTag;
}

export type HrEmploymentStatus = 'Active' | 'On Leave' | 'Suspended';

export interface HrEmployeeRecord {
  employeeId: string;
  displayName: string;
  department: string;
  role: string;
  shiftLabel: string;
  status: HrEmploymentStatus;
  joinedOn: string;
}

export interface SystemSecuritySettings {
  mfaEnforced: boolean;
  sessionTimeoutMinutes: number;
  apiKeyLastRotated: string;
  auditRetentionDays: number;
  ipAllowlistEnabled: boolean;
}

export const EQUIPMENT_STATUS_STYLES: Record<EquipmentStatus, string> = {
  Operational: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
  'Needs Calibration': 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  'Under Repair': 'bg-rose-100 text-rose-950 border border-rose-400 font-bold',
};

export const AUDIT_STATUS_STYLES: Record<AuditStatusTag, string> = {
  AUTHORIZED: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
  MFA_CHALLENGE: 'bg-sky-100 text-sky-950 border border-sky-400 font-bold',
  CRITICAL_BYPASS: 'bg-rose-100 text-rose-950 border border-rose-400 font-bold',
};

export const HR_STATUS_STYLES: Record<HrEmploymentStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
  'On Leave': 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  Suspended: 'bg-rose-100 text-rose-950 border border-rose-400 font-bold',
};

export const REPORT_DEPARTMENT_FILTERS: ReportDepartmentFilter[] = [
  'All Departments',
  'Radiology',
  'Laboratory',
  'Procurement',
  'Pharmacy',
  'Billing',
];
