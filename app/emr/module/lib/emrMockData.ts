import type {
  AuditEventType,
  ComplianceStatus,
  FolderCategory,
  SignOffStatus,
  TimelineEventType,
} from '../emrNav.types';

export type EmrPatient = {
  uhid: string;
  name: string;
  ageGender: string;
  bloodGroup: string;
  primaryConsultant: string;
  lastVisit: string;
  identityVerified: boolean;
};

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  title: string;
  detail: string;
  timestamp: string;
  provider: string;
  status: SignOffStatus;
};

export type FolderNode = {
  id: string;
  label: string;
  category: FolderCategory;
  count: number;
  children?: { id: string; label: string; date: string }[];
};

export type RecordDetail = {
  folderId: string;
  recordId: string;
  title: string;
  summary: string;
  diagnoses: string[];
  chronicConditions: string[];
  surgeries: string[];
  medications: { name: string; dose: string; status: string }[];
  criticalValues: { test: string; value: string; flag: string }[];
  authoredBy: string;
  signedAt: string;
  viewOnly: true;
};

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  user: string;
  role: string;
  action: string;
  resource: string;
  ipAddress: string;
  outcome: 'Success' | 'Denied' | 'Flagged';
  details?: string;
};

export type ConsentEntry = {
  id: string;
  consentType: string;
  grantedAt: string;
  expiresAt: string;
  status: 'Active' | 'Revoked' | 'Expired';
};

export type ComplianceCheckpoint = {
  id: string;
  standard: string;
  checkpoint: string;
  status: ComplianceStatus;
  lastAudited: string;
  owner: string;
};

export const EMR_CENSUS = {
  recentRecordsLoaded: 1248,
  activeRecords: 389,
  pendingSignOffs: 17,
  criticalAlerts: 4,
};

export const DEFAULT_PATIENT: EmrPatient = {
  uhid: 'NX-2026-000412',
  name: 'Rahul Sharma',
  ageGender: '38M',
  bloodGroup: 'B+',
  primaryConsultant: 'Dr. Rajesh Kumar',
  lastVisit: '2026-07-18',
  identityVerified: true,
};

export const PATIENT_TIMELINE: TimelineEvent[] = [
  { id: 'tl1', type: 'Registration', title: 'Patient Registration', detail: 'Demographics captured · emergency contact on file · insurance linked', timestamp: '2024-03-12 09:15', provider: 'Front Office — Priya N.', status: 'Signed' },
  { id: 'tl2', type: 'Consultation', title: 'OPD — General Medicine', detail: 'Chief complaint: progressive cough · ICD J40 Bronchitis · plan: antibiotics + CXR', timestamp: '2026-07-14 10:30', provider: 'Dr. Rajesh Kumar', status: 'Signed' },
  { id: 'tl3', type: 'Laboratory', title: 'Complete Blood Count', detail: 'WBC 11.2 ×10³/µL ↑ · Hb 13.8 g/dL · Platelets 245K', timestamp: '2026-07-14 11:05', provider: 'Lab — Dr. Sanjay Mehta', status: 'Signed' },
  { id: 'tl4', type: 'Radiology', title: 'Chest X-Ray PA View', detail: 'Bilateral lower zone infiltrates · no pleural effusion · radiologist signed', timestamp: '2026-07-14 11:45', provider: 'Radiology — Dr. Neha Gupta', status: 'Signed' },
  { id: 'tl5', type: 'Consultation', title: 'IPD Admission — Cardiology', detail: 'Admitted Ward 3A Bed 12 · telemetry monitoring · ACS rule-out protocol', timestamp: '2026-07-14 14:00', provider: 'Dr. Anita Roy', status: 'Signed' },
  { id: 'tl6', type: 'Procedure', title: 'ECG 12-Lead + Echo Screening', detail: 'SR 76 bpm · EF 58% · no regional wall motion abnormality', timestamp: '2026-07-15 08:20', provider: 'Cardiology Lab', status: 'Signed' },
  { id: 'tl7', type: 'Pharmacy', title: 'Discharge Medication Reconciliation', detail: 'Amoxicillin 500mg TID × 5d · Atorvastatin 10mg OD · dispensed Counter 2', timestamp: '2026-07-19 11:00', provider: 'Pharmacy — Sister Meera I.', status: 'Pending Sign-off' },
  { id: 'tl8', type: 'Financial Clearance', title: 'Billing Clearance — IPD Episode', detail: 'Total ₹31,200 · insurance pre-auth validated · outstanding ₹0', timestamp: '2026-07-19 11:45', provider: 'Billing — Finance Desk', status: 'Signed' },
];

export const FOLDER_TREE: FolderNode[] = [
  {
    id: 'cat-clinical',
    label: 'Clinical History',
    category: 'clinical-history',
    count: 12,
    children: [
      { id: 'ch-1', label: 'Problem List — Active & Resolved', date: '2026-07-14' },
      { id: 'ch-2', label: 'Allergy & Adverse Reaction Log', date: '2024-03-12' },
      { id: 'ch-3', label: 'Family History Summary', date: '2024-03-12' },
    ],
  },
  {
    id: 'cat-meds',
    label: 'Medication Records',
    category: 'medications',
    count: 28,
    children: [
      { id: 'med-1', label: 'Active Medication List', date: '2026-07-19' },
      { id: 'med-2', label: 'Discharge Rx — Jul 2026 IPD', date: '2026-07-19' },
      { id: 'med-3', label: 'OPD Prescriptions Archive', date: '2026-07-14' },
    ],
  },
  {
    id: 'cat-lab',
    label: 'Laboratory Records',
    category: 'laboratory',
    count: 45,
    children: [
      { id: 'lab-1', label: 'CBC — 2026-07-14', date: '2026-07-14' },
      { id: 'lab-2', label: 'Lipid Panel — 2026-01-08', date: '2026-01-08' },
      { id: 'lab-3', label: 'HbA1c Trend — 3 readings', date: '2025-11-20' },
    ],
  },
  {
    id: 'cat-rad',
    label: 'Radiology Records',
    category: 'radiology',
    count: 18,
    children: [
      { id: 'rad-1', label: 'Chest X-Ray PA — 2026-07-14', date: '2026-07-14' },
      { id: 'rad-2', label: 'Echo Report — 2026-07-15', date: '2026-07-15' },
      { id: 'rad-3', label: 'CT Brain — 2023-08-02 (External)', date: '2023-08-02' },
    ],
  },
  {
    id: 'cat-nursing',
    label: 'Nursing Records',
    category: 'nursing',
    count: 62,
    children: [
      { id: 'nur-1', label: 'Vital Signs Flowsheet — IPD 3A', date: '2026-07-14' },
      { id: 'nur-2', label: 'Nursing Assessment — Admission', date: '2026-07-14' },
      { id: 'nur-3', label: 'Intake/Output Chart — 5 days', date: '2026-07-19' },
    ],
  },
  {
    id: 'cat-docs',
    label: 'Clinical Documents',
    category: 'clinical-documents',
    count: 34,
    children: [
      { id: 'doc-1', label: 'Consultation Note — Dr. Rajesh Kumar', date: '2026-07-14' },
      { id: 'doc-2', label: 'Progress Notes — IPD Day 1–5', date: '2026-07-19' },
      { id: 'doc-3', label: 'Discharge Summary Draft', date: '2026-07-19' },
    ],
  },
];

export const RECORD_DETAILS: Record<string, RecordDetail> = {
  'ch-1': {
    folderId: 'ch-1',
    recordId: 'ch-1',
    title: 'Problem List — Active & Resolved',
    summary: 'Consolidated problem list with ICD-10 mapping. All entries view-only; modifications require clinical authoring module.',
    diagnoses: ['J40 — Bronchitis, unspecified', 'I10 — Essential hypertension', 'E11.9 — Type 2 diabetes mellitus'],
    chronicConditions: ['Hypertension — controlled on Amlodipine', 'Type 2 DM — HbA1c 7.1% (Jan 2026)'],
    surgeries: ['None documented in last 5 years'],
    medications: [],
    criticalValues: [],
    authoredBy: 'Dr. Rajesh Kumar',
    signedAt: '2026-07-14 10:45',
    viewOnly: true,
  },
  'med-1': {
    folderId: 'med-1',
    recordId: 'med-1',
    title: 'Active Medication List',
    summary: 'Medication reconciliation snapshot — read-only for Medical Records Officer review.',
    diagnoses: [],
    chronicConditions: [],
    surgeries: [],
    medications: [
      { name: 'Amlodipine 5mg', dose: 'OD', status: 'Active' },
      { name: 'Metformin 500mg', dose: 'BD', status: 'Active' },
      { name: 'Amoxicillin 500mg', dose: 'TID × 5 days', status: 'Acute — IPD discharge' },
      { name: 'Atorvastatin 10mg', dose: 'OD', status: 'Active' },
    ],
    criticalValues: [],
    authoredBy: 'Clinical Pharmacy',
    signedAt: '2026-07-19 11:00',
    viewOnly: true,
  },
  'lab-1': {
    folderId: 'lab-1',
    recordId: 'lab-1',
    title: 'Complete Blood Count — 2026-07-14',
    summary: 'STAT CBC from IPD admission workup. Critical value policy applied for WBC elevation.',
    diagnoses: [],
    chronicConditions: [],
    surgeries: [],
    medications: [],
    criticalValues: [
      { test: 'WBC', value: '11.2 ×10³/µL', flag: 'High' },
      { test: 'Hb', value: '13.8 g/dL', flag: 'Normal' },
      { test: 'Platelets', value: '245 ×10³/µL', flag: 'Normal' },
      { test: 'Neutrophils', value: '78%', flag: 'High' },
    ],
    authoredBy: 'Dr. Sanjay Mehta — Pathology',
    signedAt: '2026-07-14 11:20',
    viewOnly: true,
  },
  'rad-1': {
    folderId: 'rad-1',
    recordId: 'rad-1',
    title: 'Chest X-Ray PA View — 2026-07-14',
    summary: 'Impression: bilateral lower zone infiltrates consistent with bronchitic changes. PACS viewer available in radiology module.',
    diagnoses: ['R91 — Abnormal findings on DX imaging of lung'],
    chronicConditions: [],
    surgeries: [],
    medications: [],
    criticalValues: [],
    authoredBy: 'Dr. Neha Gupta — Radiology',
    signedAt: '2026-07-14 11:50',
    viewOnly: true,
  },
  'doc-1': {
    folderId: 'doc-1',
    recordId: 'doc-1',
    title: 'Consultation Note — View Only',
    summary: 'OPD consultation documenting 4-day cough, exertional dyspnea. Plan: antibiotics, CXR, follow-up 5 days.',
    diagnoses: ['J40 — Bronchitis'],
    chronicConditions: ['Hypertension', 'Type 2 DM'],
    surgeries: [],
    medications: [{ name: 'Amoxicillin 500mg', dose: 'TID', status: 'Prescribed' }],
    criticalValues: [],
    authoredBy: 'Dr. Rajesh Kumar',
    signedAt: '2026-07-14 10:35',
    viewOnly: true,
  },
};

export const DEFAULT_RECORD: RecordDetail = RECORD_DETAILS['ch-1'];

export const AUDIT_LOG: AuditLogEntry[] = [
  { id: 'aud-1', timestamp: '2026-07-18 11:42:18', eventType: 'Access', user: 'Records Officer — Anita P.', role: 'Medical Records', action: 'View EMR Vault', resource: 'NX-2026-000412 / Full Chart', ipAddress: '10.24.1.88', outcome: 'Success' },
  { id: 'aud-2', timestamp: '2026-07-18 11:38:05', eventType: 'Export', user: 'Quality Manager — Ravi K.', role: 'Quality & Compliance', action: 'Export Certified Summary', resource: 'NX-2026-000412', ipAddress: '10.24.1.52', outcome: 'Success', details: 'PDF watermark applied · audit trail ID EXP-8841' },
  { id: 'aud-3', timestamp: '2026-07-18 11:15:33', eventType: 'Modification', user: 'Dr. Rajesh Kumar', role: 'Consultant', action: 'Amend Consultation Note', resource: 'DOC-7782', ipAddress: '10.24.2.14', outcome: 'Success', details: 'Addendum appended — original preserved in version history' },
  { id: 'aud-4', timestamp: '2026-07-18 10:55:00', eventType: 'Access', user: 'Unknown User Attempt', role: '—', action: 'View Restricted Record', resource: 'Psychiatric Notes', ipAddress: '203.45.***.***', outcome: 'Denied', details: 'RBAC policy EMR-PSYCH-01 blocked access' },
  { id: 'aud-5', timestamp: '2026-07-18 09:30:12', eventType: 'Consent', user: 'Front Office — Priya N.', role: 'Registration', action: 'Record Consent Capture', resource: 'Treatment Consent v2.1', ipAddress: '10.24.1.20', outcome: 'Success' },
  { id: 'aud-6', timestamp: '2026-07-17 16:00:00', eventType: 'Compliance Check', user: 'System — NABH Bot', role: 'Automated', action: 'Record Completeness Scan', resource: 'Ward 3A Census', ipAddress: 'internal', outcome: 'Flagged', details: '17 records pending physician sign-off' },
];

export const CONSENT_TRACKING: ConsentEntry[] = [
  { id: 'con-1', consentType: 'General Treatment Consent', grantedAt: '2024-03-12', expiresAt: '2027-03-12', status: 'Active' },
  { id: 'con-2', consentType: 'Data Sharing — Insurance TPA', grantedAt: '2026-07-14', expiresAt: '2027-07-14', status: 'Active' },
  { id: 'con-3', consentType: 'Research Participation — Cardiology Registry', grantedAt: '2025-06-01', expiresAt: '2026-06-01', status: 'Expired' },
];

export const COMPLIANCE_CHECKPOINTS: ComplianceCheckpoint[] = [
  { id: 'cp-1', standard: 'NABH — Patient Rights', checkpoint: 'Consent documentation completeness', status: 'Pass', lastAudited: '2026-07-15', owner: 'Quality Desk' },
  { id: 'cp-2', standard: 'HIPAA — Access Control', checkpoint: 'Role-based EMR access enforcement', status: 'Pass', lastAudited: '2026-07-18', owner: 'IT Security' },
  { id: 'cp-3', standard: 'NABH — Clinical Records', checkpoint: 'Physician sign-off within 48h', status: 'Review', lastAudited: '2026-07-18', owner: 'Medical Records' },
  { id: 'cp-4', standard: 'Internal — Audit Trail', checkpoint: 'Immutable access log retention', status: 'Pass', lastAudited: '2026-07-10', owner: 'Compliance' },
  { id: 'cp-5', standard: 'NABH — Medication Safety', checkpoint: 'Medication reconciliation at discharge', status: 'Pending', lastAudited: '2026-07-19', owner: 'Clinical Pharmacy' },
];

export const DISEASE_TRENDS = [
  { quarter: 'Q1', dm: 142, htn: 198, resp: 86 },
  { quarter: 'Q2', dm: 155, htn: 205, resp: 92 },
  { quarter: 'Q3', dm: 148, htn: 212, resp: 78 },
  { quarter: 'Q4', dm: 162, htn: 220, resp: 95 },
];

export const READMISSION_ANALYSIS = [
  { period: '7-Day', rate: 2.4, benchmark: 3.0 },
  { period: '15-Day', rate: 3.8, benchmark: 4.5 },
  { period: '30-Day', rate: 5.1, benchmark: 6.0 },
];

export const RECORD_COMPLETENESS = [
  { dept: 'General Medicine', complete: 92, target: 95 },
  { dept: 'Cardiology', complete: 88, target: 95 },
  { dept: 'Orthopedics', complete: 94, target: 95 },
  { dept: 'Emergency', complete: 76, target: 90 },
];

export function searchEmr(query: string, patient: EmrPatient): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    patient.name.toLowerCase().includes(q) ||
    patient.uhid.toLowerCase().includes(q) ||
    patient.primaryConsultant.toLowerCase().includes(q)
  );
}

export function getRecordDetail(recordId: string): RecordDetail {
  return RECORD_DETAILS[recordId] ?? {
    ...DEFAULT_RECORD,
    recordId,
    folderId: recordId,
    title: 'Record Preview — View Only',
    summary: 'Select a folder item to load audited clinical content.',
  };
}
