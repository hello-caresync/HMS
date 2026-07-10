import type {
  DepartmentFinancialRow,
  ExecutiveMetricCard,
  HrEmployeeRecord,
  MedicalAssetRecord,
  ReportDepartmentFilter,
  SecurityAuditLogEntry,
  SystemSecuritySettings,
} from './types';

export const EXECUTIVE_METRICS: ExecutiveMetricCard[] = [
  {
    id: 'daily-revenue',
    label: 'Daily Revenue Total',
    value: '₹ 32,86,500',
    subtext: 'Collections · 10 Jul 2026',
    trendLabel: '+8.2% vs yesterday',
  },
  {
    id: 'opd-ipd-ratio',
    label: 'OPD vs IPD Occupancy',
    value: '47 : 186',
    subtext: 'OPD queue · IPD census beds',
    trendLabel: 'IPD 76.3% occupied',
  },
  {
    id: 'pharmacy-turnover',
    label: 'Pharmacy Inventory Turnover',
    value: '4.2×',
    subtext: 'Rolling 30-day rate',
    trendLabel: 'Target 3.5× · Above benchmark',
  },
];

export const DEPARTMENT_FINANCIALS: DepartmentFinancialRow[] = [
  { department: 'Radiology', revenue: 842000, expenses: 218000, netMargin: 74.1, transactionCount: 186 },
  { department: 'Laboratory', revenue: 615000, expenses: 192000, netMargin: 68.8, transactionCount: 412 },
  { department: 'Procurement', revenue: 0, expenses: 1240000, netMargin: 0, transactionCount: 28 },
  { department: 'Pharmacy', revenue: 315800, expenses: 248000, netMargin: 21.5, transactionCount: 892 },
  { department: 'Billing', revenue: 3286500, expenses: 412000, netMargin: 87.5, transactionCount: 1240 },
  { department: 'OPD Consultation', revenue: 842500, expenses: 156000, netMargin: 81.5, transactionCount: 647 },
  { department: 'IPD & Procedures', revenue: 1420000, expenses: 680000, netMargin: 52.1, transactionCount: 89 },
];

export function filterFinancialsByDepartment(
  filter: ReportDepartmentFilter,
): DepartmentFinancialRow[] {
  if (filter === 'All Departments') return DEPARTMENT_FINANCIALS;
  return DEPARTMENT_FINANCIALS.filter((r) => r.department === filter);
}

export const SEED_MEDICAL_ASSETS: MedicalAssetRecord[] = [
  {
    assetId: 'AST-MRI-001',
    equipmentName: 'GE 3T MRI Machine',
    roomLocator: 'Block B · MRI Suite 2 · Floor 1',
    status: 'Operational',
    warrantyExpiration: '2027-12-31',
    amcProvider: 'GE Healthcare AMC',
    amcContact: 'amc-in@gehealthcare.com',
  },
  {
    assetId: 'AST-CT-002',
    equipmentName: 'Siemens SOMATOM CT Scanner',
    roomLocator: 'Block C · CT Suite 1 · Floor 2',
    status: 'Needs Calibration',
    warrantyExpiration: '2026-11-15',
    amcProvider: 'Siemens Healthineers',
    amcContact: 'service@siemens-healthineers.in',
  },
  {
    assetId: 'AST-VENT-003',
    equipmentName: 'Dräger Evita V800 Ventilator',
    roomLocator: 'ICU-A · Bed Bay 4',
    status: 'Operational',
    warrantyExpiration: '2028-03-20',
    amcProvider: 'Dräger India Service',
    amcContact: 'support@draeger.com',
  },
  {
    assetId: 'AST-XR-004',
    equipmentName: 'Philips Digital X-Ray System',
    roomLocator: 'Block A · X-Ray Room 3',
    status: 'Under Repair',
    warrantyExpiration: '2026-08-01',
    amcProvider: 'Philips Healthcare',
    amcContact: 'care@philips.in',
  },
  {
    assetId: 'AST-ANES-005',
    equipmentName: 'Datex-Ohmeda Anesthesia Workstation',
    roomLocator: 'OT-1 · General Surgery',
    status: 'Operational',
    warrantyExpiration: '2027-06-30',
    amcProvider: 'GE Healthcare AMC',
    amcContact: 'amc-in@gehealthcare.com',
  },
];

export const SEED_SECURITY_AUDIT_LOG: SecurityAuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-07-10T09:18:42Z',
    employeeId: 'EMP-HOS-001',
    performedAction: 'Modified Pharmacy Billing Ledger',
    ipAddress: '192.168.10.42',
    statusTag: 'AUTHORIZED',
  },
  {
    id: 'aud-002',
    timestamp: '2026-07-10T09:12:08Z',
    employeeId: 'EMP-PHR-014',
    performedAction: 'Dispensed controlled substance log entry',
    ipAddress: '192.168.20.18',
    statusTag: 'MFA_CHALLENGE',
  },
  {
    id: 'aud-003',
    timestamp: '2026-07-10T08:55:31Z',
    employeeId: 'EMP-IT-002',
    performedAction: 'Updated System API Key',
    ipAddress: '10.0.4.112',
    statusTag: 'CRITICAL_BYPASS',
  },
  {
    id: 'aud-004',
    timestamp: '2026-07-10T08:41:19Z',
    employeeId: 'EMP-HOS-001',
    performedAction: 'Exported executive revenue report',
    ipAddress: '192.168.10.42',
    statusTag: 'AUTHORIZED',
  },
  {
    id: 'aud-005',
    timestamp: '2026-07-10T08:22:04Z',
    employeeId: 'EMP-LAB-008',
    performedAction: 'Overrode lab result verification lock',
    ipAddress: '192.168.30.55',
    statusTag: 'MFA_CHALLENGE',
  },
  {
    id: 'aud-006',
    timestamp: '2026-07-10T07:58:47Z',
    employeeId: 'EMP-SEC-001',
    performedAction: 'Disabled IP allowlist temporarily',
    ipAddress: '10.0.4.88',
    statusTag: 'CRITICAL_BYPASS',
  },
];

export const SEED_HR_ROSTER: HrEmployeeRecord[] = [
  { employeeId: 'EMP-HOS-001', displayName: 'Hospital Admin', department: 'Administration', role: 'hospital_admin', shiftLabel: 'Day · 08:00–20:00', status: 'Active', joinedOn: '2024-01-15' },
  { employeeId: 'EMP-PHR-014', displayName: 'Priya Menon', department: 'Pharmacy', role: 'pharmacist', shiftLabel: 'Day · 07:00–19:00', status: 'Active', joinedOn: '2023-06-01' },
  { employeeId: 'EMP-LAB-008', displayName: 'Rajesh Kumar', department: 'Laboratory', role: 'lab_technician', shiftLabel: 'Rotating · 12h', status: 'On Leave', joinedOn: '2022-11-20' },
  { employeeId: 'EMP-NRS-042', displayName: 'Sunita Iyer', department: 'IPD Nursing', role: 'staff_nurse', shiftLabel: 'Night · 19:00–07:00', status: 'Active', joinedOn: '2021-08-10' },
  { employeeId: 'EMP-IT-002', displayName: 'Vikram Das', department: 'IT & Security', role: 'system_admin', shiftLabel: 'On-call', status: 'Active', joinedOn: '2025-02-01' },
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSecuritySettings = {
  mfaEnforced: true,
  sessionTimeoutMinutes: 30,
  apiKeyLastRotated: '2026-07-01T06:00:00Z',
  auditRetentionDays: 365,
  ipAllowlistEnabled: true,
};

export function generateMaintenanceTicketId(): string {
  return `MNT-${Date.now().toString(36).toUpperCase()}`;
}
