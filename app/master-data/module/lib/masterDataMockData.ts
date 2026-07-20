import type {
  ApprovalWorkflowStatus,
  MasterRecordStatus,
  RegistryTreeNodeId,
} from '../masterDataNav.types';

export type MdmCensus = {
  totalMasterRecords: number;
  activeConfigurations: number;
  recentlyUpdated: number;
  pendingApprovals: number;
  inactiveDuplicate: number;
  dataQualityScore: number;
};

export type OrgHierarchyNode = {
  id: string;
  level: 'Branch' | 'Building' | 'Floor' | 'Block' | 'Department' | 'Unit';
  name: string;
  parent: string;
  status: MasterRecordStatus;
};

export type NumberingTemplate = {
  id: string;
  entity: string;
  template: string;
  prefix: string;
  sequencePad: number;
  lastGenerated: string;
  status: MasterRecordStatus;
};

export type PendingServiceConfig = {
  id: string;
  serviceCode: string;
  description: string;
  basePrice: number;
  discountRule: string;
  insuranceRate: string;
  status: ApprovalWorkflowStatus;
  submittedBy: string;
};

export type DoctorMasterRow = {
  id: string;
  name: string;
  department: string;
  consultationCharge: number;
  followUpCharge: number;
  status: MasterRecordStatus;
};

export type RoomBedRow = {
  id: string;
  ward: string;
  room: string;
  bed: string;
  bedType: string;
  dailyRate: number;
  status: MasterRecordStatus;
};

export type LabMasterRow = {
  id: string;
  testCode: string;
  testName: string;
  sampleType: string;
  normalRange: string;
  tatHrs: number;
  status: MasterRecordStatus;
};

export type PharmacyMasterRow = {
  id: string;
  generic: string;
  brand: string;
  dosageForm: string;
  strength: string;
  reorderLevel: number;
  status: MasterRecordStatus;
};

export type VendorMasterRow = {
  id: string;
  vendorName: string;
  category: string;
  complianceVerified: boolean;
  paymentTerms: string;
  status: MasterRecordStatus;
};

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  masterEntity: string;
  field: string;
  previousValue: string;
  updatedValue: string;
  changedBy: string;
};

export type AiDuplicateAlert = {
  id: string;
  entityType: string;
  matchScore: number;
  recordA: string;
  recordB: string;
  suggestion: string;
  status: 'Active' | 'Merged' | 'Dismissed';
};

export type AiAnomalyAlert = {
  id: string;
  category: 'Missing Config' | 'Invalid Value' | 'Orphan Record';
  message: string;
  severity: 'Warning' | 'Critical';
  status: 'Active' | 'Resolved' | 'Dismissed';
};

export type WorkflowRule = {
  id: string;
  ruleName: string;
  domain: string;
  approverLevel: string;
  status: MasterRecordStatus;
};

export const MDM_CENSUS: MdmCensus = {
  totalMasterRecords: 18420,
  activeConfigurations: 17284,
  recentlyUpdated: 186,
  pendingApprovals: 24,
  inactiveDuplicate: 112,
  dataQualityScore: 94.2,
};

export const ORG_HIERARCHY: OrgHierarchyNode[] = [
  { id: 'org-1', level: 'Branch', name: 'Nexora Main Campus — Pune', parent: '—', status: 'Active' },
  { id: 'org-2', level: 'Building', name: 'Main Clinical Block', parent: 'Nexora Main Campus', status: 'Active' },
  { id: 'org-3', level: 'Building', name: 'Critical Care Tower', parent: 'Nexora Main Campus', status: 'Active' },
  { id: 'org-4', level: 'Floor', name: 'Ground Floor — Emergency & OPD', parent: 'Main Clinical Block', status: 'Active' },
  { id: 'org-5', level: 'Floor', name: '3rd Floor — ICU & CCU', parent: 'Critical Care Tower', status: 'Active' },
  { id: 'org-6', level: 'Block', name: 'Radiology Wing B', parent: 'Main Clinical Block', status: 'Mapped' },
  { id: 'org-7', level: 'Department', name: 'Cardiology OPD', parent: 'Ground Floor', status: 'Active' },
  { id: 'org-8', level: 'Department', name: 'Central Laboratory', parent: 'Main Clinical Block', status: 'Synchronized' },
  { id: 'org-9', level: 'Unit', name: 'Cath Lab Suite 1', parent: 'Cardiology', status: 'Active' },
  { id: 'org-10', level: 'Unit', name: 'Microbiology Section', parent: 'Central Laboratory', status: 'Active' },
];

export const NUMBERING_TEMPLATES: NumberingTemplate[] = [
  { id: 'num-1', entity: 'Patient UHID', template: 'NX-{YYYY}-{XXXXXX}', prefix: 'NX', sequencePad: 6, lastGenerated: 'NX-2026-004821', status: 'Active' },
  { id: 'num-2', entity: 'Invoice', template: 'INV-{YYYY}-{XXXXX}', prefix: 'INV', sequencePad: 5, lastGenerated: 'INV-2026-44201', status: 'Active' },
  { id: 'num-3', entity: 'Purchase Request', template: 'PR-{YYYY}-{XXXXX}', prefix: 'PR', sequencePad: 5, lastGenerated: 'PR-2026-11842', status: 'Synchronized' },
  { id: 'num-4', entity: 'Lab Order', template: 'LAB-{YYYY}-{XXXXX}', prefix: 'LAB', sequencePad: 5, lastGenerated: 'LAB-2026-88102', status: 'Active' },
  { id: 'num-5', entity: 'Employee ID', template: 'EMP-{DEPT}-{XXXX}', prefix: 'EMP', sequencePad: 4, lastGenerated: 'EMP-ICU-0881', status: 'Mapped' },
];

export const INITIAL_PENDING_SERVICES: PendingServiceConfig[] = [
  { id: 'ps-1', serviceCode: 'SRV-OPD-CARD-NEW', description: 'Cardiology OPD — Senior Consultant Follow-up', basePrice: 1200, discountRule: 'Senior Citizen 10%', insuranceRate: 'Star Health Package A', status: 'Pending', submittedBy: 'Billing Admin' },
  { id: 'ps-2', serviceCode: 'SRV-IPD-ICU-DAY', description: 'ICU Daily Nursing & Monitoring Bundle', basePrice: 18500, discountRule: 'Corporate tie-up variable', insuranceRate: 'ICICI Lombard ICU cap', status: 'Under Review', submittedBy: 'IPD Finance' },
  { id: 'ps-3', serviceCode: 'SRV-LAB-HBA1C', description: 'HbA1c — NABL traceability panel', basePrice: 650, discountRule: 'None', insuranceRate: 'Cash / TPA standard', status: 'Pending', submittedBy: 'Lab Superintendent' },
];

export const DOCTOR_MASTER: DoctorMasterRow[] = [
  { id: 'doc-1', name: 'Dr. Vikram Patil', department: 'Cardiology', consultationCharge: 1500, followUpCharge: 900, status: 'Active' },
  { id: 'doc-2', name: 'Dr. Meera Iyer', department: 'Emergency Medicine', consultationCharge: 1200, followUpCharge: 800, status: 'Active' },
  { id: 'doc-3', name: 'Dr. Arjun Rao', department: 'Orthopedics', consultationCharge: 1400, followUpCharge: 850, status: 'Mapped' },
];

export const ROOM_BED_MASTER: RoomBedRow[] = [
  { id: 'rb-1', ward: 'General Ward A', room: '412', bed: 'A', bedType: 'Semi-Private', dailyRate: 4500, status: 'Active' },
  { id: 'rb-2', ward: 'ICU', room: 'ICU-3', bed: '4', bedType: 'Critical Care', dailyRate: 18500, status: 'Active' },
  { id: 'rb-3', ward: 'Maternity', room: 'M-108', bed: 'B', bedType: 'Deluxe', dailyRate: 8200, status: 'Synchronized' },
];

export const LAB_MASTER: LabMasterRow[] = [
  { id: 'lab-1', testCode: 'LAB-CBC', testName: 'Complete Blood Count', sampleType: 'EDTA Whole Blood', normalRange: 'Hb 12–16 g/dL · WBC 4–11 K', tatHrs: 4, status: 'Active' },
  { id: 'lab-2', testCode: 'LAB-TROP', testName: 'Troponin I', sampleType: 'Serum', normalRange: '< 0.04 ng/mL', tatHrs: 1, status: 'Active' },
  { id: 'lab-3', testCode: 'LAB-HBA1C', testName: 'HbA1c', sampleType: 'EDTA Whole Blood', normalRange: '4.0–5.6%', tatHrs: 8, status: 'Pending' },
];

export const PHARMACY_MASTER: PharmacyMasterRow[] = [
  { id: 'ph-1', generic: 'Metformin', brand: 'Glycomet', dosageForm: 'Tablet', strength: '500mg', reorderLevel: 500, status: 'Active' },
  { id: 'ph-2', generic: 'Piperacillin-Tazobactam', brand: 'Piptaz', dosageForm: 'Injection', strength: '4.5g', reorderLevel: 50, status: 'Active' },
  { id: 'ph-3', generic: 'Ticagrelor', brand: 'Brilinta', dosageForm: 'Tablet', strength: '90mg', reorderLevel: 200, status: 'Mapped' },
];

export const VENDOR_MASTER: VendorMasterRow[] = [
  { id: 'vn-1', vendorName: 'MedSupply India Pvt Ltd', category: 'Surgical Consumables', complianceVerified: true, paymentTerms: 'Net 30', status: 'Active' },
  { id: 'vn-2', vendorName: 'PharmaCore Distributors', category: 'IV Antibiotics', complianceVerified: true, paymentTerms: 'Net 45', status: 'Active' },
  { id: 'vn-3', vendorName: 'Global Med Equip Co', category: 'Biomedical Spares', complianceVerified: false, paymentTerms: 'Net 15', status: 'Pending' },
];

export const EMPLOYEE_MASTER = [
  { id: 'emp-1', name: 'Nurse Priya Nair', role: 'Charge Nurse', shift: 'Morning', department: 'ICU', status: 'Active' as MasterRecordStatus },
  { id: 'emp-2', name: 'Raj Malhotra', role: 'OT Technician', shift: 'Morning', department: 'OT', status: 'Active' as MasterRecordStatus },
];

export const USER_ROLES = [
  { id: 'ur-1', role: 'Admin / MDM', modules: 'All Masters · Approve · Sync', users: 4, status: 'Active' as MasterRecordStatus },
  { id: 'ur-2', role: 'Billing Configurator', modules: 'Charge Master · Insurance rates', users: 8, status: 'Active' as MasterRecordStatus },
  { id: 'ur-3', role: 'Clinical Read-Only', modules: 'Doctor · Diagnosis view', users: 42, status: 'Mapped' as MasterRecordStatus },
];

export const DIAGNOSIS_TEMPLATES = [
  { id: 'dx-1', icdCode: 'I21.4', description: 'Acute subendocardial myocardial infarction', specialty: 'Cardiology', status: 'Active' as MasterRecordStatus },
  { id: 'dx-2', icdCode: 'S72.001A', description: 'Fracture of unspecified part of neck of right femur', specialty: 'Orthopedics', status: 'Active' as MasterRecordStatus },
];

export const PATIENT_CONFIG = [
  { id: 'pc-1', field: 'UHID Generation', value: 'Auto on registration — NX template', mandatory: true, status: 'Active' as MasterRecordStatus },
  { id: 'pc-2', field: 'Identity Proof Capture', value: '[Commercial License Verification Checked/Masked for Security]', mandatory: true, status: 'Synchronized' as MasterRecordStatus },
];

export const RADIOLOGY_MASTER = [
  { id: 'rad-1', modality: 'CT', procedure: 'CT Head — Trauma Protocol', chargeCode: 'RAD-CT-HEAD', basePrice: 6500, status: 'Active' as MasterRecordStatus },
  { id: 'rad-2', modality: 'MRI', procedure: 'MRI Brain — Contrast', chargeCode: 'RAD-MRI-BRN', basePrice: 12000, status: 'Active' as MasterRecordStatus },
];

export const INVENTORY_MASTER = [
  { id: 'inv-1', sku: 'SKU-NS-500', item: 'Normal Saline 500mL', uom: 'Unit', category: 'IV Fluids', reorder: 200, status: 'Active' as MasterRecordStatus },
  { id: 'inv-2', sku: 'SKU-GLOVE-L', item: 'Surgical Gloves Large', uom: 'Box', category: 'Consumables', reorder: 500, status: 'Active' as MasterRecordStatus },
];

export const INSURANCE_TPA = [
  { id: 'ins-1', payer: 'Star Health', packageCode: 'SH-IPD-2026', coverageType: 'IPD Surgical', status: 'Active' as MasterRecordStatus },
  { id: 'ins-2', payer: 'ICICI Lombard', packageCode: 'IL-CARD-PLUS', coverageType: 'Cardiac Package', status: 'Mapped' as MasterRecordStatus },
];

export const SERVICE_CHARGE_MASTER = [
  { id: 'sc-1', code: 'SRV-OPD-GEN', description: 'General Medicine OPD Consultation', basePrice: 800, discount: 'SC 10%', insurance: 'Standard OPD', status: 'Active' as MasterRecordStatus },
  { id: 'sc-2', code: 'SRV-OT-MINOR', description: 'Minor OT Procedure — Local anesthesia', basePrice: 15000, discount: 'Approval required', insurance: 'Package dependent', status: 'Active' as MasterRecordStatus },
  { id: 'sc-3', code: 'SRV-ER-TRIAGE', description: 'Emergency Triage & Stabilization', basePrice: 2500, discount: 'None', insurance: 'ER cap', status: 'Synchronized' as MasterRecordStatus },
];

export const WORKFLOW_RULES: WorkflowRule[] = [
  { id: 'wf-1', ruleName: 'PR Approval — > ₹50,000', domain: 'Procurement', approverLevel: 'Finance HOD → Admin', status: 'Active' },
  { id: 'wf-2', ruleName: 'Discount Tier Lock — > 15%', domain: 'Billing', approverLevel: 'Billing Manager → CFO', status: 'Active' },
  { id: 'wf-3', ruleName: 'Charge Master Mutation', domain: 'Service Master', approverLevel: 'Department HOD → MDM', status: 'Mapped' },
];

export const AUDIT_LOG: AuditLogEntry[] = [
  { id: 'au-1', timestamp: '2026-07-18T08:30:00', masterEntity: 'Service Charge Master', field: 'basePrice', previousValue: '₹750', updatedValue: '₹800', changedBy: 'Billing Admin' },
  { id: 'au-2', timestamp: '2026-07-18T07:15:00', masterEntity: 'Doctor Master', field: 'consultationCharge', previousValue: '₹1,400', updatedValue: '₹1,500', changedBy: 'MDM Console' },
  { id: 'au-3', timestamp: '2026-07-17T16:00:00', masterEntity: 'Vendor Master', field: 'paymentTerms', previousValue: 'Net 30', updatedValue: 'Net 45', changedBy: 'Procurement Lead' },
  { id: 'au-4', timestamp: '2026-07-17T14:30:00', masterEntity: 'Numbering Template', field: 'sequencePad', previousValue: '5', updatedValue: '6', changedBy: 'System Architect' },
];

export const AI_DUPLICATE_ALERTS: AiDuplicateAlert[] = [
  { id: 'dup-1', entityType: 'Doctor Master', matchScore: 94, recordA: 'Dr. Vikram Patil — Cardiology', recordB: 'Dr V. Patil — Cardiac Sciences', suggestion: 'Auto-merge consultation charge profiles — retain NX-DOC-0042', status: 'Active' },
  { id: 'dup-2', entityType: 'Vendor Master', matchScore: 88, recordA: 'MedSupply India Pvt Ltd', recordB: 'Med Supply India Private Limited', suggestion: 'Merge vendor ledger — unify PO history', status: 'Active' },
  { id: 'dup-3', entityType: 'Lab Test Master', matchScore: 91, recordA: 'LAB-CBC Complete Blood Count', recordB: 'LAB-CBC-01 CBC Panel', suggestion: 'Consolidate TAT rules under LAB-CBC', status: 'Active' },
];

export const AI_ANOMALY_ALERTS: AiAnomalyAlert[] = [
  { id: 'ano-1', category: 'Missing Config', message: 'Radiology modality CT — insurance rate matrix missing for 3 corporate packages', severity: 'Critical', status: 'Active' },
  { id: 'ano-2', category: 'Invalid Value', message: 'Room Bed Master — ICU-3 Bed 4 daily rate ₹0 detected (should inherit ICU bundle)', severity: 'Warning', status: 'Active' },
  { id: 'ano-3', category: 'Orphan Record', message: 'Diagnosis template ICD S72.001A not mapped to any active orthopedic service charge', severity: 'Warning', status: 'Active' },
];

export const DATA_QUALITY_TREND = [
  { week: 'W1', score: 91.2, duplicates: 142 },
  { week: 'W2', score: 92.8, duplicates: 128 },
  { week: 'W3', score: 93.5, duplicates: 118 },
  { week: 'W4', score: 94.2, duplicates: 112 },
];

export function getRegistryTitle(nodeId: RegistryTreeNodeId): string {
  const map: Record<RegistryTreeNodeId, string> = {
    'doctor-master': 'Doctor Master & Consultation Charges',
    'employee-master': 'Employee Master & Shift Roles',
    'user-roles': 'User Role & Permission Maps',
    'patient-config': 'Patient Registration Configuration',
    'diagnosis-templates': 'Diagnosis / ICD Templates',
    'service-charge': 'Service & Charge Master',
    'room-bed': 'Room & Bed Master',
    'pharmacy-master': 'Pharmacy / Dosage Index',
    'lab-master': 'Laboratory / Sample Types & Normal Ranges',
    'radiology-master': 'Radiology Modality Master',
    'inventory-master': 'Inventory Item Master',
    'vendor-master': 'Procurement / Vendor Master',
    'insurance-tpa': 'Insurance / TPA Policy Master',
  };
  return map[nodeId];
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function searchMasterData(query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const pool = [
    ...DOCTOR_MASTER.map((d) => d.name),
    ...SERVICE_CHARGE_MASTER.map((s) => s.code),
    ...VENDOR_MASTER.map((v) => v.vendorName),
    ...NUMBERING_TEMPLATES.map((n) => n.entity),
    'organization hierarchy',
    'duplicate scan',
  ];
  return pool.filter((s) => s.toLowerCase().includes(q)).length;
}
