import type {
  ApprovalLifecycle,
  GovernanceStatus,
  IncidentStatus,
  OrgTreeNodeId,
} from '../administrationNav.types';

export type AdminCensus = {
  totalPatients: number;
  opdLoad: number;
  ipdAdmissions: number;
  erCases: number;
  availableBeds: number;
  otUtilizationPct: number;
  pendingApprovals: number;
  openComplaints: number;
  openIncidents: number;
  complianceAlerts: number;
  todayRevenue: number;
  todayExpenses: number;
};

export type OperationalLogEntry = {
  id: string;
  timestamp: string;
  category: 'Patient Flow' | 'Staff Activity' | 'Bottleneck' | 'Finance';
  message: string;
  department: string;
  severity: 'Normal' | 'Warning' | 'Critical';
};

export type PendingApproval = {
  id: string;
  type: string;
  requester: string;
  summary: string;
  department: string;
  status: ApprovalLifecycle;
  submittedAt: string;
};

export type UserProfile = {
  id: string;
  displayName: string;
  role: string;
  department: string;
  lastLogin: string;
  status: GovernanceStatus;
};

export type RbacMatrixRow = {
  id: string;
  role: string;
  modules: string;
  dataAccess: string;
  status: GovernanceStatus;
};

export type ShiftRosterRow = {
  id: string;
  staffName: string;
  role: string;
  department: string;
  shift: string;
  coverage: string;
  status: GovernanceStatus;
};

export type ComplaintRecord = {
  id: string;
  source: string;
  category: string;
  summary: string;
  status: GovernanceStatus;
  assignedTo: string;
  openedAt: string;
};

export type IncidentRecord = {
  id: string;
  type: string;
  description: string;
  rootCause: string;
  status: IncidentStatus;
  department: string;
  openedAt: string;
};

export type ComplianceRenewal = {
  id: string;
  credential: string;
  regulatoryBody: string;
  expiryDate: string;
  status: GovernanceStatus;
};

export type MeetingLog = {
  id: string;
  title: string;
  datetime: string;
  attendees: string;
  status: GovernanceStatus;
};

export type VendorContractAlert = {
  id: string;
  vendor: string;
  contractType: string;
  expiryDate: string;
  status: GovernanceStatus;
};

export type NabhMetric = {
  id: string;
  parameter: string;
  target: string;
  current: string;
  status: GovernanceStatus;
};

export type AiAdminInsight = {
  id: string;
  query: string;
  response: string;
  category: 'Operations' | 'Resource' | 'Compliance';
  severity: 'Info' | 'Warning' | 'Critical';
  status: 'Active' | 'Acknowledged' | 'Dismissed';
};

export type AuditActivityEntry = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  result: 'Success' | 'Denied' | 'Flagged';
};

export const ADMIN_CENSUS: AdminCensus = {
  totalPatients: 4862,
  opdLoad: 486,
  ipdAdmissions: 18,
  erCases: 14,
  availableBeds: 18,
  otUtilizationPct: 74.5,
  pendingApprovals: 12,
  openComplaints: 8,
  openIncidents: 3,
  complianceAlerts: 5,
  todayRevenue: 4280000,
  todayExpenses: 3180000,
};

export const OPERATIONAL_STREAM: OperationalLogEntry[] = [
  { id: 'op-1', timestamp: '2026-07-18T09:05:00', category: 'Patient Flow', message: 'ER trauma activation — 2 admissions routed to ICU step-down review', department: 'Emergency', severity: 'Critical' },
  { id: 'op-2', timestamp: '2026-07-18T08:58:00', category: 'Bottleneck', message: 'Laboratory TAT breach — 28 critical reports exceeding 6hr SLA', department: 'Laboratory', severity: 'Warning' },
  { id: 'op-3', timestamp: '2026-07-18T08:45:00', category: 'Staff Activity', message: 'ICU nursing overtime threshold exceeded — 3 staff on extended shift', department: 'ICU', severity: 'Warning' },
  { id: 'op-4', timestamp: '2026-07-18T08:30:00', category: 'Patient Flow', message: 'OPD peak queue — Cardiology wait time 42 min avg', department: 'OPD', severity: 'Warning' },
  { id: 'op-5', timestamp: '2026-07-18T08:15:00', category: 'Finance', message: 'Billing desk — 14 pending discount approvals blocking discharge', department: 'Billing', severity: 'Normal' },
  { id: 'op-6', timestamp: '2026-07-18T08:00:00', category: 'Staff Activity', message: 'Morning shift handover completed — all departments acknowledged', department: 'Administration', severity: 'Normal' },
];

export const INITIAL_APPROVALS: PendingApproval[] = [
  { id: 'ap-1', type: 'Leave Request', requester: 'Nurse Kavita Joshi', summary: 'Annual leave 5 days — Ward C coverage arranged', department: 'Nursing', status: 'Pending', submittedAt: '2026-07-18T07:00:00' },
  { id: 'ap-2', type: 'Discount Approval', requester: 'Billing Desk', summary: 'Senior citizen concession — IPD consolidated bill', department: 'Billing', status: 'Under Review', submittedAt: '2026-07-17T16:00:00' },
  { id: 'ap-3', type: 'Policy Exception', requester: 'OT Coordinator', summary: 'After-hours OT slot — emergency CABG', department: 'OT', status: 'Pending', submittedAt: '2026-07-18T06:30:00' },
];

export const USER_PROFILES: UserProfile[] = [
  { id: 'u-1', displayName: 'Dr. Admin Console', role: 'System Administrator', department: 'Administration', lastLogin: '2026-07-18T08:55:00', status: 'Active' },
  { id: 'u-2', displayName: 'Finance Controller', role: 'Finance HOD', department: 'Billing', lastLogin: '2026-07-18T08:40:00', status: 'Active' },
  { id: 'u-3', displayName: 'Nursing Superintendent', role: 'Nursing Admin', department: 'Nursing', lastLogin: '2026-07-18T07:30:00', status: 'Active' },
  { id: 'u-4', displayName: 'Guest Auditor', role: 'Read-Only Auditor', department: 'Quality', lastLogin: '2026-07-17T14:00:00', status: 'Scheduled' },
];

export const RBAC_MATRIX: RbacMatrixRow[] = [
  { id: 'rb-1', role: 'System Administrator', modules: 'All modules', dataAccess: 'Full read/write · approve · sync', status: 'Active' },
  { id: 'rb-2', role: 'Clinical HOD', modules: 'EMR · OPD · IPD · Lab · Radiology', dataAccess: 'Department scope · no finance write', status: 'Active' },
  { id: 'rb-3', role: 'Billing Operator', modules: 'Billing · Insurance · Reports', dataAccess: 'Financial read/write · no HR', status: 'Active' },
  { id: 'rb-4', role: 'Quality Auditor', modules: 'Reports · Administration · Compliance', dataAccess: 'Read-only · audit export', status: 'In Progress' },
];

export const SHIFT_ROSTERS: ShiftRosterRow[] = [
  { id: 'sh-1', staffName: 'Dr. Meera Iyer', role: 'Emergency Physician', department: 'Emergency', shift: 'Morning 06:00–14:00', coverage: 'Trauma · Triage', status: 'Active' },
  { id: 'sh-2', staffName: 'Nurse Priya Nair', role: 'Charge Nurse', department: 'ICU', shift: 'Morning 06:00–14:00', coverage: 'ICU 1–4', status: 'Active' },
  { id: 'sh-3', staffName: 'Housekeeping Team C', role: 'Supervisor', department: 'Facilities', shift: 'Morning 07:00–15:00', coverage: 'Wards A–C', status: 'Pending' },
];

export const COMPLAINTS: ComplaintRecord[] = [
  { id: 'cmp-1', source: 'Patient Feedback', category: 'Wait Time', summary: 'OPD Cardiology — excessive wait despite appointment', status: 'Pending', assignedTo: 'OPD Manager', openedAt: '2026-07-17' },
  { id: 'cmp-2', source: 'Internal Staff', category: 'Facilities', summary: 'AC malfunction Ward B — patient comfort impacted', status: 'In Progress', assignedTo: 'Facilities HOD', openedAt: '2026-07-16' },
  { id: 'cmp-3', source: 'TPA Escalation', category: 'Billing', summary: 'Pre-auth delay — discharge blocked 48hrs', status: 'Open', assignedTo: 'Insurance Desk', openedAt: '2026-07-15' },
];

export const INITIAL_INCIDENTS: IncidentRecord[] = [
  { id: 'inc-1', type: 'Patient Fall', description: 'IPD Ward B Bed 14 — assisted fall, no fracture, neuro checks ordered', rootCause: 'Pending investigation', status: 'Investigating', department: 'IPD', openedAt: '2026-07-18T02:00:00' },
  { id: 'inc-2', type: 'Equipment Failure', description: 'Steris V-PRO sterilizer — cycle validation failure, CSSD quarantine', rootCause: 'Manufacturer recall batch', status: 'Root Cause Identified', department: 'CSSD', openedAt: '2026-07-11T08:00:00' },
  { id: 'inc-3', type: 'Medication Near-Miss', description: 'Wrong patient label on IV bag — caught at bedside verification', rootCause: 'Barcode scanner offline', status: 'Open', department: 'Pharmacy', openedAt: '2026-07-18T06:00:00' },
];

export const COMPLIANCE_RENEWALS: ComplianceRenewal[] = [
  { id: 'cr-1', credential: 'Hospital Registration Certificate', regulatoryBody: 'State Health Authority', expiryDate: '2026-12-31', status: 'Active' },
  { id: 'cr-2', credential: 'Drug License — Schedule H/X', regulatoryBody: 'CDSCO / State FDA', expiryDate: '2026-08-15', status: 'Pending' },
  { id: 'cr-3', credential: 'Bio-Medical Waste Authorization', regulatoryBody: 'PCB Maharashtra', expiryDate: '2026-07-25', status: 'Critical' },
  { id: 'cr-4', credential: 'Fire NOC Renewal', regulatoryBody: 'Fire Department', expiryDate: '2026-06-30', status: 'Expired' },
];

export const MEETING_LOGS: MeetingLog[] = [
  { id: 'mtg-1', title: 'Daily Clinical Governance Huddle', datetime: '2026-07-18T09:30:00', attendees: 'HODs · Nursing Superintendent', status: 'Scheduled' },
  { id: 'mtg-2', title: 'NABH Quality Committee Review', datetime: '2026-07-19T11:00:00', attendees: 'Quality · Admin · Clinical', status: 'Scheduled' },
  { id: 'mtg-3', title: 'Incident RCA — Patient Fall Ward B', datetime: '2026-07-17T15:00:00', attendees: 'Nursing · Risk · Admin', status: 'Resolved' },
];

export const VENDOR_CONTRACT_ALERTS: VendorContractAlert[] = [
  { id: 'vc-1', vendor: 'GE Healthcare Service', contractType: 'AMC — Imaging', expiryDate: '2026-12-31', status: 'Active' },
  { id: 'vc-2', vendor: 'MedSupply India Pvt Ltd', contractType: 'Surgical Consumables SLA', expiryDate: '2026-08-01', status: 'Pending' },
  { id: 'vc-3', vendor: 'Steris Corporation', contractType: 'CSSD Equipment Support', expiryDate: '2026-07-20', status: 'Critical' },
];

export const NABH_METRICS: NabhMetric[] = [
  { id: 'nm-1', parameter: 'Patient Identification Accuracy', target: '≥ 99%', current: '99.2%', status: 'Active' },
  { id: 'nm-2', parameter: 'Hand Hygiene Compliance', target: '≥ 85%', current: '82.4%', status: 'Pending' },
  { id: 'nm-3', parameter: 'Medication Error Rate', target: '< 0.5%', current: '0.3%', status: 'Approved' },
  { id: 'nm-4', parameter: 'Patient Fall Rate (IPD)', target: '< 2/1000', current: '2.1/1000', status: 'Critical' },
];

export const INITIAL_AI_INSIGHTS: AiAdminInsight[] = [
  { id: 'ai-1', query: "Show today's hospital issues", response: '3 open incidents · 8 complaints · Lab TAT breach (28 critical) · ICU overtime · Fire NOC expired — immediate admin action required', category: 'Operations', severity: 'Critical', status: 'Active' },
  { id: 'ai-2', query: 'Which departments need attention?', response: 'Priority: Emergency (trauma surge) · Laboratory (TAT) · CSSD (sterilizer recall) · Facilities (AC Ward B) · Billing (discharge blocks)', category: 'Operations', severity: 'Warning', status: 'Active' },
  { id: 'ai-3', query: 'Staff shortage forecast — next 7 days', response: 'ICU nursing — 2 FTE gap Thu–Sat · Housekeeping Ward C — understaffed · Recommend float pool activation', category: 'Resource', severity: 'Warning', status: 'Active' },
  { id: 'ai-4', query: 'Patient load forecast', response: 'OPD expected +18% next week — monsoon respiratory pattern · ER surge probability elevated Fri–Sun', category: 'Resource', severity: 'Info', status: 'Active' },
];

export const AUDIT_ACTIVITY: AuditActivityEntry[] = [
  { id: 'au-1', timestamp: '2026-07-18T08:50:00', user: 'Dr. Admin Console', action: 'RBAC matrix update — Quality Auditor role', module: 'Administration', result: 'Success' },
  { id: 'au-2', timestamp: '2026-07-18T08:20:00', user: 'Unknown Proxy', action: 'Bulk user export attempt', module: 'User Management', result: 'Denied' },
  { id: 'au-3', timestamp: '2026-07-18T07:45:00', user: 'Finance Controller', action: 'Approved discount policy exception', module: 'Billing', result: 'Success' },
  { id: 'au-4', timestamp: '2026-07-18T07:00:00', user: 'System', action: 'Emergency protocol drill scheduled', module: 'Administration', result: 'Success' },
];

export const ORG_CONFIG_DETAILS: Record<OrgTreeNodeId, { title: string; rows: { label: string; value: string }[] }> = {
  'hospital-profile': {
    title: 'Hospital Registration & Legal Profile',
    rows: [
      { label: 'Legal Entity', value: 'Nexora Multispeciality Hospitals Pvt Ltd' },
      { label: 'Registration Ref', value: '[Administrative License Verification Masked for Privacy Security]' },
      { label: 'Tax Compliance', value: '[Administrative License Verification Masked for Privacy Security]' },
      { label: 'Accreditation', value: 'NABH Pre-accreditation · NABL Lab' },
    ],
  },
  'buildings-floors': {
    title: 'Buildings & Floors Mapping',
    rows: [
      { label: 'Main Clinical Block', value: 'Ground · 1st · 2nd · Basement' },
      { label: 'Critical Care Tower', value: '3rd · 4th · 5th' },
      { label: 'Emergency Wing', value: 'Ground — Trauma · Triage' },
    ],
  },
  'departments-map': {
    title: 'Departments & Units Map',
    rows: [
      { label: 'Clinical', value: 'OPD · IPD · ICU · Emergency · OT · Cath Lab' },
      { label: 'Ancillary', value: 'Lab · Radiology · Pharmacy · CSSD' },
      { label: 'Support', value: 'Billing · HR · IT · Facilities · Admin' },
    ],
  },
  'org-structure': {
    title: 'Corporate Hierarchy',
    rows: [
      { label: 'Board → CEO', value: 'Medical Director · COO · CFO' },
      { label: 'Clinical Leadership', value: 'HODs — Medicine · Surgery · Diagnostics' },
      { label: 'Operations', value: 'Nursing Superintendent · Admin Head' },
    ],
  },
  'reporting-hierarchy': {
    title: 'Reporting Lines & Escalation',
    rows: [
      { label: 'Clinical Escalation', value: 'Resident → HOD → Medical Director' },
      { label: 'Operational Escalation', value: 'Shift Lead → Dept Manager → COO' },
      { label: 'Incident Escalation', value: 'Unit → Risk Committee → CEO (Critical)' },
    ],
  },
  'employee-admin': {
    title: 'Employee Records & Onboarding',
    rows: [
      { label: 'Active Employees', value: '1,842 FTE · 186 contract' },
      { label: 'Pending Onboarding', value: '12 — background verification in progress' },
      { label: 'Credential Verification', value: '[Administrative License Verification Masked for Privacy Security]' },
    ],
  },
  'dept-working-hours': {
    title: 'Working Hours & Shift Templates',
    rows: [
      { label: 'OPD Hours', value: 'Mon–Sat 08:00–20:00 · Sun 09:00–14:00' },
      { label: 'IPD Nursing', value: '3-shift rotation — 06:00 / 14:00 / 22:00' },
      { label: 'Emergency', value: '24×7 · trauma team activation protocol' },
    ],
  },
  'dept-service-setup': {
    title: 'Service Setup & OPD Slots',
    rows: [
      { label: 'Cardiology OPD', value: '20 min slots · 4 consultants · peak 09:00–12:00' },
      { label: 'General Medicine', value: '15 min slots · walk-in + appointment' },
      { label: 'Teleconsult', value: 'Enabled — video · async messaging' },
    ],
  },
};

export const PATIENT_LOAD_FORECAST = [
  { day: 'Mon', opd: 420, er: 12, ipd: 310 },
  { day: 'Tue', opd: 445, er: 11, ipd: 312 },
  { day: 'Wed', opd: 468, er: 13, ipd: 315 },
  { day: 'Thu', opd: 490, er: 14, ipd: 318 },
  { day: 'Fri', opd: 512, er: 16, ipd: 320 },
  { day: 'Sat', opd: 380, er: 18, ipd: 305 },
  { day: 'Sun', opd: 290, er: 15, ipd: 298 },
];

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatInrCr(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return formatInr(amount);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function searchAdministration(query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const pool = [
    ...USER_PROFILES.map((u) => u.displayName),
    ...INITIAL_INCIDENTS.map((i) => i.type),
    ...COMPLIANCE_RENEWALS.map((c) => c.credential),
    'governance',
    'rbac',
    'nabh',
  ];
  return pool.filter((s) => s.toLowerCase().includes(q)).length;
}

export function getOrgNodeTitle(nodeId: OrgTreeNodeId): string {
  return ORG_CONFIG_DETAILS[nodeId]?.title ?? 'Configuration';
}
