import type { IntegrationLogId, RegistryTreeNodeId, SettingsStatus, UserAccountType } from '../settingsNav.types';

export type SystemHealthSnapshot = {
  totalUsers: number;
  activeUsers: number;
  databaseHealth: SettingsStatus;
  systemHealth: SettingsStatus;
  activeIntegrations: number;
  pendingConfigs: number;
  storageUsedPct: number;
  backupStatus: SettingsStatus;
  lastBackupAt: string;
};

export type ProvisionedUser = {
  id: string;
  displayName: string;
  accountType: UserAccountType;
  department: string;
  lastLogin: string;
  status: SettingsStatus;
  auditAction: string;
};

export type FieldAccessRow = {
  id: string;
  role: string;
  module: string;
  readAccess: boolean;
  writeAccess: boolean;
  approveRights: boolean;
  fieldMask: string;
  status: SettingsStatus;
};

export type ModuleFeatureToggle = {
  id: string;
  module: string;
  feature: string;
  enabled: boolean;
  scope: string;
};

export type ProcessConfigField = {
  label: string;
  value: string;
  masked?: boolean;
};

export type WorkflowApprovalRule = {
  id: string;
  ruleName: string;
  trigger: string;
  threshold: string;
  approverChain: string;
  status: SettingsStatus;
};

export type IntegrationEndpoint = {
  id: IntegrationLogId;
  protocol: string;
  name: string;
  endpoint: string;
  rateLimit: string;
  lastSync: string;
  status: SettingsStatus;
  maskedCredential: boolean;
};

export type BackupProtocol = {
  id: string;
  type: string;
  schedule: string;
  retention: string;
  lastRun: string;
  status: SettingsStatus;
};

export type PrintTemplate = {
  id: string;
  name: string;
  module: string;
  format: string;
  status: SettingsStatus;
};

export type SecurityControl = {
  id: string;
  control: string;
  configuration: string;
  status: SettingsStatus;
  masked?: boolean;
};

export type ComplianceThreshold = {
  id: string;
  framework: string;
  control: string;
  threshold: string;
  current: string;
  status: SettingsStatus;
};

export type SystemLogEntry = {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';
  source: string;
  message: string;
};

export const SYSTEM_HEALTH: SystemHealthSnapshot = {
  totalUsers: 2148,
  activeUsers: 1864,
  databaseHealth: 'Healthy',
  systemHealth: 'Operational',
  activeIntegrations: 14,
  pendingConfigs: 7,
  storageUsedPct: 68.4,
  backupStatus: 'Active',
  lastBackupAt: '2026-07-18T03:00:00',
};

export const PROVISIONED_USERS: ProvisionedUser[] = [
  { id: 'su-1', displayName: 'Dr. Arjun Malhotra', accountType: 'Doctor', department: 'Cardiology', lastLogin: '2026-07-18T09:12:00', status: 'Active', auditAction: 'EMR access — clinical write' },
  { id: 'su-2', displayName: 'Nurse Kavita Joshi', accountType: 'Nurse', department: 'ICU Ward C', lastLogin: '2026-07-18T08:45:00', status: 'Active', auditAction: 'Shift roster sync — verified' },
  { id: 'su-3', displayName: 'Rahul Deshmukh', accountType: 'Finance', department: 'Billing & RCM', lastLogin: '2026-07-18T08:30:00', status: 'Active', auditAction: 'Discount approval matrix updated' },
  { id: 'su-4', displayName: 'System Admin Console', accountType: 'Admin', department: 'IT & Operations', lastLogin: '2026-07-18T09:00:00', status: 'Active', auditAction: 'RBAC policy publish — v4.2' },
  { id: 'su-5', displayName: 'Priya Menon', accountType: 'Pharmacist', department: 'Central Pharmacy', lastLogin: '2026-07-18T07:55:00', status: 'Active', auditAction: 'Controlled drug register — audit pass' },
  { id: 'su-6', displayName: 'Dr. Guest Lecturer', accountType: 'Doctor', department: 'Visiting Faculty', lastLogin: '2026-07-10T14:00:00', status: 'Disabled', auditAction: 'Account suspended — contract ended' },
];

export const FIELD_ACCESS_GRID: FieldAccessRow[] = [
  { id: 'fa-1', role: 'System Administrator', module: 'All Modules', readAccess: true, writeAccess: true, approveRights: true, fieldMask: 'None — full visibility', status: 'Active' },
  { id: 'fa-2', role: 'Consultant Physician', module: 'EMR · OPD · Lab View', readAccess: true, writeAccess: true, approveRights: false, fieldMask: 'Billing fields masked', status: 'Active' },
  { id: 'fa-3', role: 'Billing Operator', module: 'Billing · Insurance · Reports', readAccess: true, writeAccess: true, approveRights: true, fieldMask: 'Clinical notes read-only', status: 'Active' },
  { id: 'fa-4', role: 'Pharmacy Dispenser', module: 'Pharmacy · Inventory View', readAccess: true, writeAccess: true, approveRights: false, fieldMask: 'Patient identifiers masked', status: 'Active' },
  { id: 'fa-5', role: 'Quality Auditor', module: 'Reports · Compliance · Audit', readAccess: true, writeAccess: false, approveRights: false, fieldMask: 'PII masked · export logged', status: 'Interfaced' },
];

export const MODULE_TOGGLES: ModuleFeatureToggle[] = [
  { id: 'mt-opd-1', module: 'OPD', feature: 'Walk-in Queue Management', enabled: true, scope: 'All OPD counters' },
  { id: 'mt-opd-2', module: 'OPD', feature: 'Teleconsult Video Slots', enabled: true, scope: 'Cardiology · General Medicine' },
  { id: 'mt-ipd-1', module: 'IPD', feature: 'Bed Allocation Matrix', enabled: true, scope: 'All wards' },
  { id: 'mt-ipd-2', module: 'IPD', feature: 'Nursing Care Plan Templates', enabled: false, scope: 'Pilot — ICU only' },
  { id: 'mt-er-1', module: 'Emergency', feature: 'Trauma Activation Protocol', enabled: true, scope: '24×7 ER' },
  { id: 'mt-ot-1', module: 'OT', feature: 'Block Scheduling & Sterility Checklist', enabled: true, scope: '6 OT suites' },
  { id: 'mt-emr-1', module: 'EMR', feature: 'Structured Clinical Templates', enabled: true, scope: 'All specialties' },
];

export const WORKFLOW_APPROVAL_RULES: WorkflowApprovalRule[] = [
  { id: 'wf-1', ruleName: 'Purchase Requisition — Above Threshold', trigger: 'PR value > ₹50,000', threshold: '₹50,000', approverChain: 'Dept HOD → Finance → COO', status: 'Active' },
  { id: 'wf-2', ruleName: 'IPD Bill Discount — Senior Citizen', trigger: 'Discount > 10%', threshold: '10%', approverChain: 'Billing Supervisor → Finance HOD', status: 'Active' },
  { id: 'wf-3', ruleName: 'Controlled Drug Issue — Schedule H', trigger: 'Any Schedule H dispense', threshold: 'All', approverChain: 'Pharmacist → Medical Director', status: 'Active' },
  { id: 'wf-4', ruleName: 'Vendor Onboarding — New Supplier', trigger: 'New vendor master', threshold: 'N/A', approverChain: 'Procurement → Finance → Admin', status: 'Pending' },
  { id: 'wf-5', ruleName: 'After-Hours OT Slot', trigger: 'OT booking outside 08:00–20:00', threshold: 'Time-based', approverChain: 'OT Coordinator → Medical Director', status: 'Active' },
];

export const INTEGRATION_ENDPOINTS: IntegrationEndpoint[] = [
  { id: 'hl7-adt', protocol: 'HL7 v2.5', name: 'ADT Patient Demographics Feed', endpoint: 'Internal MLLP Gateway — Port 2575', rateLimit: '500 msg/min', lastSync: '2026-07-18T09:10:00', status: 'Interfaced', maskedCredential: true },
  { id: 'fhir-patient', protocol: 'FHIR R4', name: 'Patient Resource Registry', endpoint: 'FHIR Server — /Patient · /Encounter', rateLimit: '200 req/min', lastSync: '2026-07-18T09:08:00', status: 'FHIR Synced', maskedCredential: true },
  { id: 'pacs-dicom', protocol: 'DICOM · WADO-RS', name: 'PACS Image Archive Linkage', endpoint: 'Orthanc PACS — Study/Series/Instance', rateLimit: '120 studies/hr', lastSync: '2026-07-18T08:55:00', status: 'Interfaced', maskedCredential: false },
  { id: 'lis-lab', protocol: 'HL7 ORU · ASTM', name: 'LIS Result Inbound Interface', endpoint: 'Roche Cobas · Siemens Atellica', rateLimit: '1000 results/day', lastSync: '2026-07-18T09:05:00', status: 'Operational', maskedCredential: true },
  { id: 'payment-gateway', protocol: 'REST · Webhook', name: 'Payment Gateway — UPI/Card/NEFT', endpoint: 'Razorpay Merchant API', rateLimit: '300 txn/min', lastSync: '2026-07-18T08:50:00', status: 'Active', maskedCredential: true },
  { id: 'sms-webhook', protocol: 'HTTPS Webhook', name: 'Patient Notification SMS Gateway', endpoint: 'MSG91 Transactional API', rateLimit: '5000 SMS/day', lastSync: '2026-07-18T08:00:00', status: 'Active', maskedCredential: true },
];

export const BACKUP_PROTOCOLS: BackupProtocol[] = [
  { id: 'bk-1', type: 'Full Database Snapshot', schedule: 'Daily 03:00 IST', retention: '30 days rolling', lastRun: '2026-07-18T03:00:00', status: 'Active' },
  { id: 'bk-2', type: 'Incremental Transaction Log', schedule: 'Every 15 minutes', retention: '7 days', lastRun: '2026-07-18T09:00:00', status: 'Operational' },
  { id: 'bk-3', type: 'Document Storage — DMS', schedule: 'Daily 04:00 IST', retention: '90 days', lastRun: '2026-07-18T04:00:00', status: 'Active' },
  { id: 'bk-4', type: 'Offsite DR Replication', schedule: 'Daily 05:00 IST', retention: '14 days', lastRun: '2026-07-17T05:00:00', status: 'Pending' },
];

export const PRINT_TEMPLATES: PrintTemplate[] = [
  { id: 'pt-1', name: 'OPD Consultation Receipt', module: 'OPD · Billing', format: 'A5 Thermal · Logo header', status: 'Active' },
  { id: 'pt-2', name: 'IPD Discharge Summary', module: 'IPD · EMR', format: 'A4 · NABH footer block', status: 'Active' },
  { id: 'pt-3', name: 'Lab Report — NABL Format', module: 'Laboratory', format: 'A4 · QR verification', status: 'Active' },
  { id: 'pt-4', name: 'Radiology Report — PACS Link', module: 'Radiology', format: 'A4 · DICOM viewer URL', status: 'Interfaced' },
  { id: 'pt-5', name: 'Pharmacy Prescription Label', module: 'Pharmacy', format: '40×30mm · Barcode', status: 'Active' },
];

export const SECURITY_CONTROLS: SecurityControl[] = [
  { id: 'sc-1', control: 'Two-Factor Authentication (TOTP)', configuration: 'Mandatory for Admin · Finance · Pharmacy', status: 'Active', masked: false },
  { id: 'sc-2', control: 'IP Restriction — Admin Console', configuration: 'Hospital LAN + VPN subnet only', status: 'Active', masked: false },
  { id: 'sc-3', control: 'Device Filter — Mobile Access', configuration: 'MDM-enrolled devices · biometric unlock', status: 'Pending', masked: false },
  { id: 'sc-4', control: 'Payment Gateway Token Vault', configuration: '[System Parameter Block Masked for Enterprise Security]', status: 'Active', masked: true },
  { id: 'sc-5', control: 'AI Engine — Predictive Analytics', configuration: 'Read-only forecasts · no auto-actions', status: 'Interfaced', masked: false },
  { id: 'sc-6', control: 'Session Timeout — Clinical Workstations', configuration: '15 min idle · 8 hr max session', status: 'Active', masked: false },
];

export const COMPLIANCE_THRESHOLDS: ComplianceThreshold[] = [
  { id: 'ct-1', framework: 'NABH', control: 'Patient Identification Accuracy', threshold: '≥ 99%', current: '99.2%', status: 'Active' },
  { id: 'ct-2', framework: 'NABH', control: 'Medication Error Rate', threshold: '< 0.5%', current: '0.3%', status: 'Healthy' },
  { id: 'ct-3', framework: 'HIPAA', control: 'PHI Access Audit Coverage', threshold: '100% logged', current: '99.8%', status: 'Security Alert' },
  { id: 'ct-4', framework: 'HIPAA', control: 'Encryption at Rest — EMR', threshold: 'AES-256', current: 'AES-256 verified', status: 'Active' },
  { id: 'ct-5', framework: 'CDSCO', control: 'Drug License Renewal Window', threshold: '60 days pre-expiry alert', current: 'Alert triggered — Aug 2026', status: 'Pending' },
];

export const SYSTEM_LOGS: SystemLogEntry[] = [
  { id: 'sl-1', timestamp: '2026-07-18T09:12:00', level: 'INFO', source: 'Auth Service', message: 'Dr. Arjun Malhotra — EMR session established · MFA verified' },
  { id: 'sl-2', timestamp: '2026-07-18T09:05:00', level: 'INFO', source: 'HL7 Gateway', message: 'ADT feed — 42 patient updates processed · 0 errors' },
  { id: 'sl-3', timestamp: '2026-07-18T08:58:00', level: 'WARN', source: 'Backup Service', message: 'Offsite DR replication lag — 18 min behind schedule' },
  { id: 'sl-4', timestamp: '2026-07-18T08:45:00', level: 'SECURITY', source: 'Access Control', message: 'Blocked login attempt — non-whitelisted IP · proxy flagged' },
  { id: 'sl-5', timestamp: '2026-07-18T08:30:00', level: 'ERROR', source: 'LIS Interface', message: 'Siemens Atellica — ORU timeout · 3 results queued for retry' },
  { id: 'sl-6', timestamp: '2026-07-18T08:00:00', level: 'INFO', source: 'Scheduler', message: 'Nightly config sync completed — 7 pending configs remain' },
];

export const REGISTRY_CONFIG_DETAILS: Record<RegistryTreeNodeId, { title: string; subtitle: string; fields: ProcessConfigField[] }> = {
  'hospital-general': {
    title: 'Institutional Profile & Branding',
    subtitle: 'Legal entity · branding · operational identifiers',
    fields: [
      { label: 'Hospital Legal Name', value: 'Nexora Multispeciality Hospitals Pvt Ltd' },
      { label: 'Registration Reference', value: '[System Parameter Block Masked for Enterprise Security]', masked: true },
      { label: 'Primary Campus', value: 'Andheri East · Mumbai · 400069' },
      { label: 'Brand Theme', value: 'Navy Slate · Cobalt Blue · Clinical White' },
    ],
  },
  'branch-credentials': {
    title: 'Multi-Branch Credentials',
    subtitle: 'Satellite campuses · branch-level compliance',
    fields: [
      { label: 'Branch — Thane Outpatient Centre', value: 'Operational · OPD + Diagnostics' },
      { label: 'Branch License Bundle', value: '[System Parameter Block Masked for Enterprise Security]', masked: true },
      { label: 'Branch — Navi Mumbai Day Care', value: 'Scheduled launch — Aug 2026' },
    ],
  },
  localization: {
    title: 'Localization Rules',
    subtitle: 'Currency · date · time · number formats',
    fields: [
      { label: 'Currency', value: 'INR (₹) — Indian Rupee' },
      { label: 'Date Format', value: 'DD-MM-YYYY' },
      { label: 'Time Format', value: '24-hour · IST (UTC+5:30)' },
      { label: 'Number Format', value: 'en-IN · lakh/crore grouping' },
    ],
  },
  'module-opd': {
    title: 'OPD Module Configuration',
    subtitle: 'Outpatient workflows · queue · consult slots',
    fields: [
      { label: 'Default Slot Duration', value: '15 minutes · override per specialty' },
      { label: 'Walk-in Queue', value: 'Enabled · token + SMS alert' },
      { label: 'Peak Hour Throttle', value: '09:00–12:00 · max 4 concurrent/consultant' },
    ],
  },
  'module-ipd': {
    title: 'IPD Module Configuration',
    subtitle: 'Admission · bed · nursing · discharge',
    fields: [
      { label: 'Bed Categories', value: 'General · Semi-Private · Private · ICU · NICU' },
      { label: 'Auto Bed Hold', value: '48 hours post-discharge planning' },
      { label: 'Nursing Documentation', value: 'Shift assessment · MAR · care plan' },
    ],
  },
  'module-emergency': {
    title: 'Emergency Module Configuration',
    subtitle: 'Triage · trauma · code activation',
    fields: [
      { label: 'Triage Protocol', value: 'ESI-5 · color-coded priority' },
      { label: 'Trauma Team Activation', value: 'Code Blue broadcast · 90 sec SLA' },
      { label: 'Ambulance Pre-Alert', value: 'Enabled — ETA + vitals inbound' },
    ],
  },
  'module-ot': {
    title: 'OT Coordination Configuration',
    subtitle: 'Scheduling · sterility · implant tracking',
    fields: [
      { label: 'OT Suites', value: '6 major · 2 minor · 1 cath lab hybrid' },
      { label: 'Block Booking', value: 'HOD approval · emergency override' },
      { label: 'Implant Register', value: 'Barcode scan · manufacturer traceability' },
    ],
  },
  'module-emr': {
    title: 'EMR Module Configuration',
    subtitle: 'Clinical documentation · orders · results',
    fields: [
      { label: 'Template Library', value: '847 structured templates · specialty packs' },
      { label: 'Order Sets', value: 'CPOE enabled · allergy cross-check' },
      { label: 'Result Routing', value: 'Critical values — pager + SMS escalation' },
    ],
  },
  'appointment-slots': {
    title: 'Appointment Slot Limits',
    subtitle: 'Per-consultant · per-department caps',
    fields: [
      { label: 'Cardiology — Dr. Malhotra', value: 'Max 24 slots/day · 20 min each' },
      { label: 'General Medicine Pool', value: 'Max 120 slots/day · 15 min each' },
      { label: 'Teleconsult Cap', value: 'Max 8 video slots/consultant/day' },
    ],
  },
  'billing-tax': {
    title: 'Billing & Tax Rules',
    subtitle: 'GST/CGST structures · concessions · packages',
    fields: [
      { label: 'GST Registration', value: '[System Parameter Block Masked for Enterprise Security]', masked: true },
      { label: 'CGST/SGST Split', value: 'Intra-state 9% + 9% · Inter-state IGST 18%' },
      { label: 'Senior Citizen Concession', value: '10% auto-apply · supervisor approval > 15%' },
      { label: 'Package Billing', value: 'Maternity · Cardiac · Ortho bundles enabled' },
    ],
  },
  'pharmacy-lab-radiology': {
    title: 'Pharmacy · Lab · Radiology Criteria',
    subtitle: 'Reference ranges · PACS protocols · dispensing rules',
    fields: [
      { label: 'Lab Normal Ranges', value: 'Age/gender stratified · NABL validated' },
      { label: 'Critical Value Escalation', value: 'Phone + pager · 15 min ack SLA' },
      { label: 'PACS Viewer Protocol', value: 'WADO-RS · hanging protocols by modality' },
      { label: 'Pharmacy Generic Substitution', value: 'Formulary-first · physician override logged' },
    ],
  },
  'scm-triggers': {
    title: 'SCM Automated Tracking Triggers',
    subtitle: 'Reorder · expiry · consumption alerts',
    fields: [
      { label: 'Reorder Point — Surgical Consumables', value: 'Min 7 days stock · auto-PR generation' },
      { label: 'Expiry Alert Window', value: '90 · 60 · 30 days · pharmacy + stores' },
      { label: 'Implant Consignment Tracking', value: 'Real-time · OT usage deduction' },
    ],
  },
  'workflow-approvals': {
    title: 'Workflow & Approval Rules',
    subtitle: 'PR · discount · vendor · OT logic',
    fields: [
      { label: 'Active Rules', value: '5 approval chains configured' },
      { label: 'Escalation Timeout', value: '4 hours · auto-escalate to next approver' },
      { label: 'Audit Trail', value: 'Immutable · timestamped · user-attributed' },
    ],
  },
};

export const INTEGRATION_LOG_DETAILS: Record<IntegrationLogId, { title: string; rows: { label: string; value: string; masked?: boolean }[] }> = {
  'hl7-adt': {
    title: 'HL7 ADT Patient Demographics Feed',
    rows: [
      { label: 'Message Types', value: 'ADT^A01 · A02 · A03 · A08 · A11' },
      { label: 'Sending Application', value: 'Nexora HMS — ADT Publisher' },
      { label: 'Receiving Systems', value: 'LIS · PACS · Billing · Insurance Pre-Auth' },
      { label: 'Auth Token', value: '[System Parameter Block Masked for Enterprise Security]', masked: true },
    ],
  },
  'fhir-patient': {
    title: 'FHIR R4 Patient Resource Registry',
    rows: [
      { label: 'Base URL', value: 'Internal FHIR Server — /fhir/R4' },
      { label: 'Supported Resources', value: 'Patient · Encounter · Observation · DiagnosticReport' },
      { label: 'Sync Mode', value: 'Real-time subscription · 5 min batch reconcile' },
      { label: 'OAuth Client Secret', value: '[System Parameter Block Masked for Enterprise Security]', masked: true },
    ],
  },
  'pacs-dicom': {
    title: 'PACS DICOM Image Archive',
    rows: [
      { label: 'AE Title', value: 'NEXORA_PACS' },
      { label: 'Modalities', value: 'CT · MRI · X-Ray · USG · Mammography' },
      { label: 'Storage', value: '12 TB allocated · 68% utilized' },
      { label: 'WADO-RS Endpoint', value: 'Internal — TLS 1.3' },
    ],
  },
  'lis-lab': {
    title: 'LIS Laboratory Interface',
    rows: [
      { label: 'Analyzers', value: 'Roche Cobas 6000 · Siemens Atellica · Sysmex XN' },
      { label: 'Result Format', value: 'HL7 ORU^R01 · ASTM fallback' },
      { label: 'Critical Value Route', value: 'Direct to EMR + pager escalation' },
      { label: 'Interface Key', value: '[System Parameter Block Masked for Enterprise Security]', masked: true },
    ],
  },
  'payment-gateway': {
    title: 'Payment Gateway Integration',
    rows: [
      { label: 'Provider', value: 'Razorpay — UPI · Card · NetBanking · NEFT' },
      { label: 'Settlement Cycle', value: 'T+1 · auto-reconciliation nightly' },
      { label: 'Merchant Token', value: '[System Parameter Block Masked for Enterprise Security]', masked: true },
      { label: 'Webhook Events', value: 'payment.captured · refund.processed · dispute.created' },
    ],
  },
  'sms-webhook': {
    title: 'SMS Notification Gateway',
    rows: [
      { label: 'Provider', value: 'MSG91 — Transactional Route' },
      { label: 'Templates', value: 'Appointment · Lab Ready · Discharge · OTP' },
      { label: 'API Key', value: '[System Parameter Block Masked for Enterprise Security]', masked: true },
      { label: 'Daily Quota', value: '5,000 SMS · 82% utilized today' },
    ],
  },
};

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

export function searchSettings(query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const pool = [
    ...PROVISIONED_USERS.map((u) => u.displayName),
    ...INTEGRATION_ENDPOINTS.map((i) => i.name),
    ...WORKFLOW_APPROVAL_RULES.map((w) => w.ruleName),
    'rbac',
    'fhir',
    'hl7',
    'backup',
    'gst',
    'nabh',
    'hipaa',
  ];
  return pool.filter((s) => s.toLowerCase().includes(q)).length;
}

export function getRegistryNodeTitle(nodeId: RegistryTreeNodeId): string {
  return REGISTRY_CONFIG_DETAILS[nodeId]?.title ?? 'Configuration';
}
