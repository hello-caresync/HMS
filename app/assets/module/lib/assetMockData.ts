import type {
  AssetCategory,
  AssetOperationalStatus,
  BreakdownTicketStatus,
  DisposalWorkflowStatus,
  PmRoutine,
  RequestApprovalStage,
  RequestPriority,
} from '../assetNav.types';

export type AssetCensus = {
  totalAssets: number;
  totalAssetValue: number;
  activeAssets: number;
  underMaintenance: number;
  damagedIdle: number;
  expiringWarranties: number;
  amcExpiringSoon: number;
  calibrationDue: number;
  pendingRequests: number;
  disposedAssets: number;
};

export type AssetRequest = {
  id: string;
  department: string;
  itemDescription: string;
  priority: RequestPriority;
  stage: RequestApprovalStage;
  requester: string;
  estimatedCost: number;
  submittedAt: string;
};

export type AssetLocation = {
  id: string;
  assetTag: string;
  assetName: string;
  building: string;
  floor: string;
  department: string;
  room: string;
  bedLocation: string;
  status: AssetOperationalStatus;
  lastMovedAt: string;
};

export type AssetMasterRecord = {
  id: string;
  assetTag: string;
  name: string;
  category: AssetCategory;
  serialRef: string;
  qrRfidTag: string;
  status: AssetOperationalStatus;
  department: string;
  purchaseDate: string;
  netBookValue: number;
  warrantyExpiry: string;
  amcVendor: string;
  calibrationDue: string | null;
  complianceVerified: boolean;
};

export type PreventiveMaintenance = {
  id: string;
  assetTag: string;
  assetName: string;
  routine: PmRoutine;
  lastCompleted: string;
  nextDue: string;
  assignedEngineer: string;
  status: 'Scheduled' | 'Overdue' | 'Completed';
};

export type BreakdownTicket = {
  id: string;
  assetTag: string;
  assetName: string;
  reportedBy: string;
  issue: string;
  status: BreakdownTicketStatus;
  downtimeHours: number;
  assignedTo: string;
  openedAt: string;
};

export type AmcRecord = {
  id: string;
  assetTag: string;
  vendor: string;
  slaResponseHrs: number;
  slaResolutionHrs: number;
  contractEnd: string;
  annualCost: number;
  status: 'Active' | 'Expiring' | 'Expired';
};

export type CalibrationRecord = {
  id: string;
  assetTag: string;
  equipment: string;
  regulatoryBody: string;
  lastCalibrated: string;
  dueDate: string;
  status: 'Calibrated' | 'Due Soon' | 'Expired';
};

export type SparePartRecord = {
  id: string;
  partCode: string;
  description: string;
  linkedAsset: string;
  stockQty: number;
  reorderLevel: number;
  lastIssued: string;
};

export type FinancialLedgerEntry = {
  id: string;
  assetTag: string;
  assetName: string;
  acquisitionCost: number;
  netBookValue: number;
  depreciationMethod: 'Straight-Line' | 'Written-Down';
  annualDepreciation: number;
  warrantyExpiry: string;
  auditVerified: boolean;
};

export type DisposalRecord = {
  id: string;
  assetTag: string;
  assetName: string;
  reason: string;
  residualValue: number;
  workflowStatus: DisposalWorkflowStatus;
  submittedAt: string;
};

export type AiAssetInsight = {
  id: string;
  category: 'Predictive Maintenance' | 'Utilization' | 'Capital Planning' | 'Compliance';
  message: string;
  severity: 'Info' | 'Warning' | 'Critical';
  status: 'Active' | 'Acknowledged' | 'Dismissed';
  generatedAt: string;
};

export type UtilizationMetric = {
  assetTag: string;
  name: string;
  category: AssetCategory;
  hoursUsed: number;
  capacityHours: number;
  utilizationPct: number;
  idleFlag: boolean;
};

export const ASSET_CENSUS: AssetCensus = {
  totalAssets: 2847,
  totalAssetValue: 1428000000,
  activeAssets: 2412,
  underMaintenance: 86,
  damagedIdle: 42,
  expiringWarranties: 28,
  amcExpiringSoon: 15,
  calibrationDue: 34,
  pendingRequests: 19,
  disposedAssets: 307,
};

export const INITIAL_ASSET_REQUESTS: AssetRequest[] = [
  { id: 'AR-2026-441', department: 'ICU', itemDescription: 'Dräger Evita V300 Ventilator — surge capacity unit', priority: 'Emergency', stage: 'Manager Review', requester: 'Dr. Meera Iyer', estimatedCost: 2850000, submittedAt: '2026-07-18T07:30:00' },
  { id: 'AR-2026-438', department: 'Radiology', itemDescription: 'CT tube replacement kit — GE Optima CT660', priority: 'Critical', stage: 'Finance', requester: 'Rad Tech Lead', estimatedCost: 4200000, submittedAt: '2026-07-17T14:00:00' },
  { id: 'AR-2026-435', department: 'Laboratory', itemDescription: 'Beckman Coulter AU680 reagent module upgrade', priority: 'Normal', stage: 'Procurement', requester: 'Lab Superintendent', estimatedCost: 890000, submittedAt: '2026-07-16T10:00:00' },
  { id: 'AR-2026-432', department: 'Emergency', itemDescription: 'Philips HeartStart defibrillator — backup unit', priority: 'Critical', stage: 'Request', requester: 'ER Charge Nurse', estimatedCost: 385000, submittedAt: '2026-07-18T08:00:00' },
  { id: 'AR-2026-429', department: 'IT', itemDescription: 'PACS workstation refresh — radiology reading room', priority: 'Normal', stage: 'Approved', requester: 'IT Infrastructure', estimatedCost: 620000, submittedAt: '2026-07-12T09:00:00' },
];

export const INITIAL_ASSET_LOCATIONS: AssetLocation[] = [
  { id: 'loc-1', assetTag: 'NX-AST-004821', assetName: 'GE Optima CT660', building: 'Main Block', floor: 'Ground', department: 'Radiology', room: 'CT Suite B', bedLocation: '—', status: 'Active', lastMovedAt: '2025-11-10' },
  { id: 'loc-2', assetTag: 'NX-AST-002156', assetName: 'Dräger Evita V300', building: 'Critical Care Tower', floor: '3rd', department: 'ICU', room: 'ICU-3', bedLocation: 'Bed 4', status: 'Under Maintenance', lastMovedAt: '2026-07-17' },
  { id: 'loc-3', assetTag: 'NX-AST-003902', assetName: 'Philips Ingenia MRI 1.5T', building: 'Main Block', floor: 'Basement', department: 'Radiology', room: 'MRI Suite A', bedLocation: '—', status: 'Active', lastMovedAt: '2024-03-22' },
  { id: 'loc-4', assetTag: 'NX-AST-005118', assetName: 'Mindray BeneVision N22', building: 'Emergency Wing', floor: 'Ground', department: 'Emergency', room: 'Trauma Bay 2', bedLocation: 'Bay 2', status: 'Breakdown', lastMovedAt: '2026-07-18' },
  { id: 'loc-5', assetTag: 'NX-AST-001445', assetName: 'Dell PowerEdge PACS Server', building: 'Admin Block', floor: '2nd', department: 'IT', room: 'Server Room A', bedLocation: 'Rack 12', status: 'Active', lastMovedAt: '2026-01-15' },
  { id: 'loc-6', assetTag: 'NX-AST-006220', assetName: 'Steris V-PRO Sterilizer', building: 'OT Block', floor: '1st', department: 'CSSD', room: 'Sterilization Bay 1', bedLocation: '—', status: 'Recall', lastMovedAt: '2026-06-01' },
];

export const INITIAL_ASSET_MASTER: AssetMasterRecord[] = [
  { id: 'am-1', assetTag: 'NX-AST-004821', name: 'GE Optima CT660', category: 'CT Scanner', serialRef: '[Serial Mapping Log — Masked]', qrRfidTag: 'QR-NX-004821', status: 'Active', department: 'Radiology', purchaseDate: '2022-08-15', netBookValue: 18500000, warrantyExpiry: '2027-08-14', amcVendor: 'GE Healthcare India', calibrationDue: '2026-09-15', complianceVerified: true },
  { id: 'am-2', assetTag: 'NX-AST-003902', name: 'Philips Ingenia MRI 1.5T', category: 'MRI', serialRef: '[Serial Mapping Log — Masked]', qrRfidTag: 'RFID-NX-003902', status: 'Active', department: 'Radiology', purchaseDate: '2021-03-22', netBookValue: 42000000, warrantyExpiry: '2026-03-21', amcVendor: 'Philips Healthcare', calibrationDue: '2026-08-01', complianceVerified: true },
  { id: 'am-3', assetTag: 'NX-AST-002156', name: 'Dräger Evita V300', category: 'Ventilator', serialRef: '[Serial Mapping Log — Masked]', qrRfidTag: 'QR-NX-002156', status: 'Under Maintenance', department: 'ICU', purchaseDate: '2023-06-10', netBookValue: 2100000, warrantyExpiry: '2028-06-09', amcVendor: 'Dräger India', calibrationDue: null, complianceVerified: true },
  { id: 'am-4', assetTag: 'NX-AST-005118', name: 'Mindray BeneVision N22', category: 'Patient Monitor', serialRef: '[Serial Mapping Log — Masked]', qrRfidTag: 'QR-NX-005118', status: 'Breakdown', department: 'Emergency', purchaseDate: '2024-01-08', netBookValue: 485000, warrantyExpiry: '2027-01-07', amcVendor: 'Mindray Medical', calibrationDue: '2026-07-25', complianceVerified: true },
  { id: 'am-5', assetTag: 'NX-AST-007331', name: 'Schiller AT-102 Plus ECG', category: 'ECG', serialRef: '[Serial Mapping Log — Masked]', qrRfidTag: 'QR-NX-007331', status: 'Active', department: 'Cardiology OPD', purchaseDate: '2023-11-20', netBookValue: 185000, warrantyExpiry: '2026-07-20', amcVendor: 'Schiller AG India', calibrationDue: '2026-07-22', complianceVerified: true },
  { id: 'am-6', assetTag: 'NX-AST-008902', name: 'Beckman Coulter AU680', category: 'Lab Analyzer', serialRef: '[Serial Mapping Log — Masked]', qrRfidTag: 'RFID-NX-008902', status: 'Active', department: 'Central Laboratory', purchaseDate: '2020-05-12', netBookValue: 6200000, warrantyExpiry: '2025-05-11', amcVendor: 'Beckman Coulter', calibrationDue: '2026-07-30', complianceVerified: true },
  { id: 'am-7', assetTag: 'NX-AST-001445', name: 'Dell PowerEdge R750 PACS Node', category: 'IT Asset', serialRef: '[Serial Mapping Log — Masked]', qrRfidTag: 'QR-NX-001445', status: 'Active', department: 'IT Infrastructure', purchaseDate: '2025-01-15', netBookValue: 890000, warrantyExpiry: '2028-01-14', amcVendor: 'Dell ProSupport', calibrationDue: null, complianceVerified: true },
  { id: 'am-8', assetTag: 'NX-AST-006220', name: 'Steris V-PRO Low Temp Sterilizer', category: 'Infrastructure', serialRef: '[Serial Mapping Log — Masked]', qrRfidTag: 'QR-NX-006220', status: 'Recall', department: 'CSSD', purchaseDate: '2019-09-01', netBookValue: 3200000, warrantyExpiry: '2024-08-31', amcVendor: 'Steris Corporation', calibrationDue: null, complianceVerified: false },
];

export const PREVENTIVE_MAINTENANCE: PreventiveMaintenance[] = [
  { id: 'pm-1', assetTag: 'NX-AST-004821', assetName: 'GE Optima CT660', routine: 'Quarterly', lastCompleted: '2026-04-10', nextDue: '2026-07-10', assignedEngineer: 'Biomed Eng. Rajesh K.', status: 'Overdue' },
  { id: 'pm-2', assetTag: 'NX-AST-003902', assetName: 'Philips Ingenia MRI', routine: 'Yearly', lastCompleted: '2025-08-01', nextDue: '2026-08-01', assignedEngineer: 'Philips FSE Team', status: 'Scheduled' },
  { id: 'pm-3', assetTag: 'NX-AST-008902', assetName: 'Beckman AU680', routine: 'Monthly', lastCompleted: '2026-07-01', nextDue: '2026-08-01', assignedEngineer: 'Lab Equipment Tech', status: 'Scheduled' },
  { id: 'pm-4', assetTag: 'NX-AST-002156', assetName: 'Dräger Evita V300', routine: 'Quarterly', lastCompleted: '2026-05-15', nextDue: '2026-08-15', assignedEngineer: 'Biomed Eng. Priya S.', status: 'Scheduled' },
];

export const INITIAL_BREAKDOWN_TICKETS: BreakdownTicket[] = [
  { id: 'BD-2026-088', assetTag: 'NX-AST-005118', assetName: 'Mindray BeneVision N22', reportedBy: 'ER Charge Nurse', issue: 'SpO2 module intermittent failure — patient monitoring compromised', status: 'Assigned', downtimeHours: 6.5, assignedTo: 'Biomed Eng. Amit D.', openedAt: '2026-07-18T02:00:00' },
  { id: 'BD-2026-085', assetTag: 'NX-AST-006220', assetName: 'Steris V-PRO Sterilizer', reportedBy: 'CSSD Supervisor', issue: 'Manufacturer recall — hydrogen peroxide cycle validation failure', status: 'In Repair', downtimeHours: 168, assignedTo: 'Steris FSE', openedAt: '2026-07-11T08:00:00' },
  { id: 'BD-2026-082', assetTag: 'NX-AST-002156', assetName: 'Dräger Evita V300', reportedBy: 'ICU Charge', issue: 'Scheduled PM — flow sensor calibration drift detected', status: 'In Repair', downtimeHours: 12, assignedTo: 'Dräger Service', openedAt: '2026-07-17T06:00:00' },
];

export const AMC_RECORDS: AmcRecord[] = [
  { id: 'amc-1', assetTag: 'NX-AST-004821', vendor: 'GE Healthcare India', slaResponseHrs: 4, slaResolutionHrs: 24, contractEnd: '2026-12-31', annualCost: 840000, status: 'Active' },
  { id: 'amc-2', assetTag: 'NX-AST-003902', vendor: 'Philips Healthcare', slaResponseHrs: 8, slaResolutionHrs: 48, contractEnd: '2026-03-21', annualCost: 2100000, status: 'Expiring' },
  { id: 'amc-3', assetTag: 'NX-AST-008902', vendor: 'Beckman Coulter', slaResponseHrs: 24, slaResolutionHrs: 72, contractEnd: '2025-05-11', annualCost: 420000, status: 'Expired' },
];

export const CALIBRATION_RECORDS: CalibrationRecord[] = [
  { id: 'cal-1', assetTag: 'NX-AST-007331', equipment: 'Schiller AT-102 Plus ECG', regulatoryBody: 'CDSCO / NABL traceability', lastCalibrated: '2026-01-22', dueDate: '2026-07-22', status: 'Due Soon' },
  { id: 'cal-2', assetTag: 'NX-AST-005118', equipment: 'Mindray BeneVision N22', regulatoryBody: 'IEC 60601-2-49', lastCalibrated: '2026-01-25', dueDate: '2026-07-25', status: 'Due Soon' },
  { id: 'cal-3', assetTag: 'NX-AST-008902', equipment: 'Beckman Coulter AU680', regulatoryBody: 'NABL ISO 15189', lastCalibrated: '2026-01-30', dueDate: '2026-07-30', status: 'Due Soon' },
  { id: 'cal-4', assetTag: 'NX-AST-004821', equipment: 'GE Optima CT660', regulatoryBody: 'AERB / CDSCO', lastCalibrated: '2026-03-15', dueDate: '2026-09-15', status: 'Calibrated' },
];

export const SPARE_PARTS: SparePartRecord[] = [
  { id: 'sp-1', partCode: 'SP-DRG-FLOW-SNS', description: 'Dräger Evita flow sensor assembly', linkedAsset: 'NX-AST-002156', stockQty: 2, reorderLevel: 3, lastIssued: '2026-06-10' },
  { id: 'sp-2', partCode: 'SP-MND-SPO2-MOD', description: 'Mindray SpO2 module replacement kit', linkedAsset: 'NX-AST-005118', stockQty: 1, reorderLevel: 2, lastIssued: '2026-07-18' },
  { id: 'sp-3', partCode: 'SP-GE-CT-TUBE', description: 'GE CT X-ray tube assembly (Optima 660)', linkedAsset: 'NX-AST-004821', stockQty: 0, reorderLevel: 1, lastIssued: '2025-11-20' },
  { id: 'sp-4', partCode: 'SP-BCK-REAG-PUMP', description: 'Beckman AU680 reagent pump module', linkedAsset: 'NX-AST-008902', stockQty: 4, reorderLevel: 2, lastIssued: '2026-05-08' },
];

export const FINANCIAL_LEDGER: FinancialLedgerEntry[] = [
  { id: 'fl-1', assetTag: 'NX-AST-003902', assetName: 'Philips Ingenia MRI 1.5T', acquisitionCost: 58000000, netBookValue: 42000000, depreciationMethod: 'Straight-Line', annualDepreciation: 5800000, warrantyExpiry: '2026-03-21', auditVerified: true },
  { id: 'fl-2', assetTag: 'NX-AST-004821', assetName: 'GE Optima CT660', acquisitionCost: 24000000, netBookValue: 18500000, depreciationMethod: 'Written-Down', annualDepreciation: 3600000, warrantyExpiry: '2027-08-14', auditVerified: true },
  { id: 'fl-3', assetTag: 'NX-AST-008902', assetName: 'Beckman Coulter AU680', acquisitionCost: 9800000, netBookValue: 6200000, depreciationMethod: 'Straight-Line', annualDepreciation: 980000, warrantyExpiry: '2025-05-11', auditVerified: false },
];

export const DISPOSAL_RECORDS: DisposalRecord[] = [
  { id: 'disp-1', assetTag: 'NX-AST-000892', assetName: 'Legacy Siemens Somatom CT', reason: 'End-of-life — radiation source decommissioning required', residualValue: 250000, workflowStatus: 'Finance Review', submittedAt: '2026-07-10' },
  { id: 'disp-2', assetTag: 'NX-AST-000445', assetName: 'Obsolete PACS workstation cluster', reason: 'Technology refresh — HIPAA storage non-compliance', residualValue: 45000, workflowStatus: 'Pending', submittedAt: '2026-07-15' },
];

export const INITIAL_AI_INSIGHTS: AiAssetInsight[] = [
  { id: 'ai-1', category: 'Predictive Maintenance', message: 'Dräger Evita V300 (NX-AST-002156) may require flow sensor servicing within 15 days based on 2,840 ventilation hours and drift trend analysis', severity: 'Warning', status: 'Active', generatedAt: '2026-07-18T08:00:00' },
  { id: 'ai-2', category: 'Utilization', message: 'GE Optima CT660 utilization at 94% capacity — peak hours 09:00–14:00; recommend slot optimization to reduce OPD imaging wait times', severity: 'Info', status: 'Active', generatedAt: '2026-07-18T07:30:00' },
  { id: 'ai-3', category: 'Capital Planning', message: 'Philips MRI warranty expires Mar 2026 — capital replacement forecast ₹58M; lease vs buy analysis recommended Q4 FY26', severity: 'Warning', status: 'Active', generatedAt: '2026-07-17T16:00:00' },
  { id: 'ai-4', category: 'Compliance', message: '3 ECG/Monitor calibration certificates expiring within 7 days — regulatory audit risk flagged for Cardiology & Emergency', severity: 'Critical', status: 'Active', generatedAt: '2026-07-18T06:00:00' },
];

export const UTILIZATION_METRICS: UtilizationMetric[] = [
  { assetTag: 'NX-AST-004821', name: 'GE Optima CT660', category: 'CT Scanner', hoursUsed: 376, capacityHours: 400, utilizationPct: 94, idleFlag: false },
  { assetTag: 'NX-AST-003902', name: 'Philips Ingenia MRI', category: 'MRI', hoursUsed: 288, capacityHours: 400, utilizationPct: 72, idleFlag: false },
  { assetTag: 'NX-AST-008902', name: 'Beckman AU680', category: 'Lab Analyzer', hoursUsed: 380, capacityHours: 400, utilizationPct: 95, idleFlag: false },
  { assetTag: 'NX-AST-007331', name: 'Schiller ECG OPD-3', category: 'ECG', hoursUsed: 42, capacityHours: 400, utilizationPct: 10.5, idleFlag: true },
  { assetTag: 'NX-AST-001445', name: 'PACS Server Node', category: 'IT Asset', hoursUsed: 398, capacityHours: 400, utilizationPct: 99.5, idleFlag: false },
];

export const DEPRECIATION_TREND = [
  { year: 'FY22', gross: 980, nbv: 820 },
  { year: 'FY23', gross: 1120, nbv: 890 },
  { year: 'FY24', gross: 1280, nbv: 940 },
  { year: 'FY25', gross: 1380, nbv: 980 },
  { year: 'FY26', gross: 1428, nbv: 1010 },
];

export { formatINR as formatInr } from '@/lib/utils/currency';

export function formatInrCr(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return formatInr(amount);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function searchAssets(query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const pool = [
    ...INITIAL_ASSET_MASTER.map((a) => `${a.assetTag} ${a.name} ${a.category}`),
    ...INITIAL_ASSET_LOCATIONS.map((l) => `${l.assetTag} ${l.assetName} ${l.department}`),
    ...INITIAL_ASSET_REQUESTS.map((r) => `${r.id} ${r.itemDescription}`),
  ];
  return pool.filter((s) => s.toLowerCase().includes(q)).length;
}

export type AssetDetailDrawerData = AssetMasterRecord;
