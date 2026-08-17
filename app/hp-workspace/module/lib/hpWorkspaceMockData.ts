import type {
  AiInsightStatus,
  ApprovalStatus,
  ApprovalType,
  HpRolePersona,
  TaskPriority,
  TaskStatus,
} from '../hpWorkspaceNav.types';

export type HpCensus = {
  todayAppointments: number;
  admissions: number;
  discharges: number;
  emergencyCases: number;
  pendingTasks: number;
};

export type ActivityFeedItem = {
  id: string;
  timestamp: string;
  category: 'Clinical' | 'Administrative' | 'Emergency' | 'Finance' | 'Supply';
  message: string;
  actor: string;
  department: string;
};

export type WorkQueueItem = {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  queueType: string;
  assignedRole: HpRolePersona;
  department: string;
  dueAt: string;
  patientRef?: string;
};

export type ChatThread = {
  id: string;
  channel: string;
  lastMessage: string;
  participants: string;
  unread: number;
  updatedAt: string;
};

export type SharedDocument = {
  id: string;
  title: string;
  department: string;
  version: string;
  updatedAt: string;
  accessLevel: 'Internal' | 'Restricted' | 'Department';
};

export type MeetingAgenda = {
  id: string;
  title: string;
  datetime: string;
  attendees: string;
  location: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
};

export type ActivePatientSummary = {
  id: string;
  uhid: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  ward: string;
  attendingPhysician: string;
  admissionDate: string;
  diagnosis: string;
  allergies: string[];
  identityVerified: boolean;
};

export type MedicalHistoryEvent = {
  id: string;
  date: string;
  type: 'Admission' | 'Procedure' | 'Lab' | 'Prescription' | 'Discharge';
  summary: string;
  provider: string;
};

export type PrescriptionStatus = {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  status: 'Active' | 'Dispensed' | 'Held' | 'Discontinued';
  prescribedBy: string;
};

export type MedicalOrder = {
  id: string;
  orderType: string;
  details: string;
  status: 'Ordered' | 'In Progress' | 'Completed' | 'Cancelled';
  orderedAt: string;
  priority: TaskPriority;
};

export type DepartmentCapacity = {
  department: string;
  occupied: number;
  total: number;
  waitlist: number;
  status: 'Normal' | 'High' | 'Critical';
};

export type BedAvailability = {
  ward: string;
  available: number;
  total: number;
  isolation: number;
  icuStepDown: boolean;
};

export type OnDutyShift = {
  id: string;
  staffName: string;
  role: string;
  department: string;
  shift: 'Morning' | 'Evening' | 'Night';
  coverage: string;
};

export type EquipmentMaintenance = {
  id: string;
  equipment: string;
  location: string;
  status: 'Operational' | 'Scheduled Maintenance' | 'Out of Service';
  nextService: string;
};

export type ApprovalRequest = {
  id: string;
  type: ApprovalType;
  requester: string;
  summary: string;
  amount?: number;
  status: ApprovalStatus;
  submittedAt: string;
  department: string;
};

export type ShiftComplianceRecord = {
  id: string;
  staffName: string;
  department: string;
  scheduledHours: number;
  actualHours: number;
  compliance: 'Compliant' | 'Overtime' | 'Understaffed';
  date: string;
};

export type AiHospitalInsight = {
  id: string;
  category: 'Capacity' | 'Inventory' | 'Clinical' | 'Operational' | 'Security';
  message: string;
  severity: 'Info' | 'Warning' | 'Critical';
  status: AiInsightStatus;
  generatedAt: string;
};

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  ipMasked: string;
  result: 'Success' | 'Denied' | 'Flagged';
};

export type PerformanceKpi = {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  target: number;
};

export type UniversalSearchResult = {
  type: 'Patient' | 'Doctor' | 'Staff' | 'Invoice' | 'Lab' | 'Purchase Order';
  id: string;
  label: string;
  subtitle: string;
};

export const HP_CENSUS: HpCensus = {
  todayAppointments: 142,
  admissions: 18,
  discharges: 11,
  emergencyCases: 7,
  pendingTasks: 34,
};

export const INITIAL_ACTIVITY_FEED: ActivityFeedItem[] = [
  { id: 'af-1', timestamp: '2026-07-18T08:12:00', category: 'Emergency', message: 'Trauma bay activated — MVA polytrauma, GCS 13, ortho & neuro consult requested', actor: 'Dr. Meera Iyer', department: 'Emergency' },
  { id: 'af-2', timestamp: '2026-07-18T08:05:00', category: 'Clinical', message: 'Post-op ICU transfer completed — CABG patient to ICU-4, ventilator settings verified', actor: 'Nurse Priya Nair', department: 'OT / ICU' },
  { id: 'af-3', timestamp: '2026-07-18T07:48:00', category: 'Finance', message: 'Corporate tie-up pre-auth approved — Tata AIG package NX-CORP-882 for IPD admission', actor: 'Finance Desk', department: 'Billing' },
  { id: 'af-4', timestamp: '2026-07-18T07:30:00', category: 'Administrative', message: 'Morning census sync — 312 active inpatients, 28 pending discharges flagged for MD review', actor: 'Admin Console', department: 'Admissions' },
  { id: 'af-5', timestamp: '2026-07-18T07:15:00', category: 'Supply', message: 'Critical stock alert — Piperacillin-Tazobactam 4.5g below reorder point, PR auto-generated', actor: 'Inventory System', department: 'Pharmacy' },
  { id: 'af-6', timestamp: '2026-07-18T06:55:00', category: 'Clinical', message: 'Lab critical value escalated — Potassium 6.2 mEq/L, nephrology callback initiated', actor: 'LIMS Auto-Router', department: 'Laboratory' },
];

export const INITIAL_WORK_QUEUE: WorkQueueItem[] = [
  { id: 'wq-1', title: 'Emergency consult — chest pain triage', priority: 'Emergency', status: 'Pending', queueType: 'Doctor Consultation', assignedRole: 'Doctor', department: 'Emergency', dueAt: '2026-07-18T08:30:00', patientRef: 'NX-2026-004821' },
  { id: 'wq-2', title: 'Medication reconciliation — post-admission', priority: 'High', status: 'In Progress', queueType: 'Nurse Medication Checklist', assignedRole: 'Nurse', department: 'IPD Ward B', dueAt: '2026-07-18T09:00:00', patientRef: 'NX-2026-004798' },
  { id: 'wq-3', title: 'Discharge summary sign-off — orthopedics', priority: 'High', status: 'Pending', queueType: 'Doctor Consultation', assignedRole: 'Doctor', department: 'Orthopedics', dueAt: '2026-07-18T10:00:00', patientRef: 'NX-2026-004755' },
  { id: 'wq-4', title: 'Purchase request approval — surgical consumables', priority: 'Normal', status: 'Pending', queueType: 'Procurement Routing', assignedRole: 'Procurement', department: 'Supply Chain', dueAt: '2026-07-18T14:00:00' },
  { id: 'wq-5', title: 'Insurance document verification — pre-auth packet', priority: 'High', status: 'In Progress', queueType: 'Finance Validation', assignedRole: 'Finance', department: 'Billing', dueAt: '2026-07-18T11:30:00', patientRef: 'NX-2026-004812' },
  { id: 'wq-6', title: 'Bed turnover sanitization — Ward C Room 412', priority: 'Normal', status: 'Verified', queueType: 'Housekeeping Task', assignedRole: 'Staff', department: 'Facilities', dueAt: '2026-07-18T08:45:00' },
];

export const CHAT_THREADS: ChatThread[] = [
  { id: 'ch-1', channel: '#emergency-handover', lastMessage: 'Trauma bay 2 — blood products cross-matched, awaiting neuro clearance', participants: 'ER Team · ICU · Blood Bank', unread: 4, updatedAt: '2026-07-18T08:10:00' },
  { id: 'ch-2', channel: '#ipd-ward-b', lastMessage: 'Insulin sliding scale updated for Bed 14 — pharmacy notified', participants: 'Nursing · Pharmacy', unread: 0, updatedAt: '2026-07-18T07:55:00' },
  { id: 'ch-3', channel: '#procurement-urgent', lastMessage: 'PO-2026-11842 expedited — vendor confirmed dispatch by 14:00', participants: 'Procurement · OT Stores', unread: 2, updatedAt: '2026-07-18T07:40:00' },
];

export const SHARED_DOCUMENTS: SharedDocument[] = [
  { id: 'doc-1', title: 'Infection Control Protocol — Monsoon Season 2026', department: 'Quality', version: 'v3.2', updatedAt: '2026-07-15', accessLevel: 'Internal' },
  { id: 'doc-2', title: 'OT Scheduling Matrix — Week 29', department: 'OT Coordination', version: 'v1.0', updatedAt: '2026-07-17', accessLevel: 'Department' },
  { id: 'doc-3', title: 'Corporate Insurance Tariff Sheet — Q3 2026', department: 'Billing', version: 'v2.1', updatedAt: '2026-07-10', accessLevel: 'Restricted' },
];

export const MEETING_AGENDAS: MeetingAgenda[] = [
  { id: 'mtg-1', title: 'Daily Clinical Governance Huddle', datetime: '2026-07-18T09:30:00', attendees: 'HODs · Nursing Superintendent · Admin', location: 'Conference Room A', status: 'Scheduled' },
  { id: 'mtg-2', title: 'ICU Capacity Review — Surge Planning', datetime: '2026-07-18T11:00:00', attendees: 'Critical Care · Admissions · Finance', location: 'Virtual — Teams', status: 'Scheduled' },
  { id: 'mtg-3', title: 'Pharmacy Formulary Committee', datetime: '2026-07-17T15:00:00', attendees: 'Pharmacy · Clinical Pharmacology · Procurement', location: 'Board Room', status: 'Completed' },
];

export const ACTIVE_PATIENTS: ActivePatientSummary[] = [
  { id: 'pt-1', uhid: 'NX-2026-004821', name: 'Rajesh Kulkarni', age: 58, gender: 'M', ward: 'Emergency · Trauma Bay 2', attendingPhysician: 'Dr. Meera Iyer', admissionDate: '2026-07-18', diagnosis: 'Polytrauma — MVA, rib fractures, suspected TBI', allergies: ['Penicillin', 'Sulfa drugs'], identityVerified: true },
  { id: 'pt-2', uhid: 'NX-2026-004798', name: 'Anita Deshmukh', age: 67, gender: 'F', ward: 'IPD Ward B · Bed 14', attendingPhysician: 'Dr. Vikram Patil', admissionDate: '2026-07-16', diagnosis: 'NSTEMI — post-PCI, on dual antiplatelet therapy', allergies: ['None documented'], identityVerified: true },
  { id: 'pt-3', uhid: 'NX-2026-004755', name: 'Suresh Menon', age: 45, gender: 'M', ward: 'Orthopedics · Bed 208', attendingPhysician: 'Dr. Arjun Rao', admissionDate: '2026-07-14', diagnosis: 'Right femur ORIF — planned discharge today', allergies: ['Latex — mild contact dermatitis'], identityVerified: true },
];

export const MEDICAL_HISTORY: Record<string, MedicalHistoryEvent[]> = {
  'pt-1': [
    { id: 'mh-1', date: '2026-07-18', type: 'Admission', summary: 'Emergency admission via ambulance — trauma activation', provider: 'Dr. Meera Iyer' },
    { id: 'mh-2', date: '2026-07-18', type: 'Lab', summary: 'CBC, BMP, coagulation panel — hemoglobin 11.2 g/dL', provider: 'Central Lab' },
  ],
  'pt-2': [
    { id: 'mh-3', date: '2026-07-16', type: 'Admission', summary: 'Chest pain — troponin elevated, cath lab activated', provider: 'Dr. Vikram Patil' },
    { id: 'mh-4', date: '2026-07-16', type: 'Procedure', summary: 'PCI with drug-eluting stent — LAD 90% lesion', provider: 'Cath Lab Team' },
    { id: 'mh-5', date: '2026-07-17', type: 'Prescription', summary: 'DAPT initiated — Aspirin 75mg + Ticagrelor 90mg BD', provider: 'Dr. Vikram Patil' },
  ],
};

export const PRESCRIPTIONS: PrescriptionStatus[] = [
  { id: 'rx-1', medication: 'Morphine IV', dosage: '2mg', frequency: 'Q4H PRN pain', status: 'Active', prescribedBy: 'Dr. Meera Iyer' },
  { id: 'rx-2', medication: 'Piperacillin-Tazobactam', dosage: '4.5g', frequency: 'Q8H IV', status: 'Active', prescribedBy: 'Dr. Meera Iyer' },
  { id: 'rx-3', medication: 'Ticagrelor', dosage: '90mg', frequency: 'BD PO', status: 'Dispensed', prescribedBy: 'Dr. Vikram Patil' },
];

export const MEDICAL_ORDERS: MedicalOrder[] = [
  { id: 'mo-1', orderType: 'Imaging', details: 'CT Head without contrast — trauma protocol', status: 'In Progress', orderedAt: '2026-07-18T08:15:00', priority: 'Emergency' },
  { id: 'mo-2', orderType: 'Lab', details: 'Repeat BMP + coagulation in 4 hours', status: 'Ordered', orderedAt: '2026-07-18T08:20:00', priority: 'High' },
  { id: 'mo-3', orderType: 'Consult', details: 'Neurosurgery evaluation — GCS monitoring', status: 'Ordered', orderedAt: '2026-07-18T08:18:00', priority: 'Emergency' },
  { id: 'mo-4', orderType: 'Nursing', details: 'Neuro checks Q1H × 24 hours', status: 'In Progress', orderedAt: '2026-07-18T08:22:00', priority: 'High' },
];

export const DEPARTMENT_CAPACITY: DepartmentCapacity[] = [
  { department: 'OPD', occupied: 86, total: 120, waitlist: 14, status: 'High' },
  { department: 'IPD', occupied: 312, total: 380, waitlist: 8, status: 'Normal' },
  { department: 'ICU', occupied: 28, total: 32, waitlist: 3, status: 'Critical' },
  { department: 'Emergency', occupied: 12, total: 16, waitlist: 5, status: 'High' },
  { department: 'OT', occupied: 4, total: 8, waitlist: 6, status: 'High' },
  { department: 'Pharmacy', occupied: 0, total: 0, waitlist: 22, status: 'High' },
];

export const BED_AVAILABILITY: BedAvailability[] = [
  { ward: 'General Ward A', available: 8, total: 60, isolation: 2, icuStepDown: false },
  { ward: 'General Ward B', available: 4, total: 60, isolation: 1, icuStepDown: false },
  { ward: 'ICU', available: 4, total: 32, isolation: 4, icuStepDown: true },
  { ward: 'Pediatric Ward', available: 6, total: 40, isolation: 2, icuStepDown: false },
  { ward: 'Maternity', available: 3, total: 30, isolation: 0, icuStepDown: false },
];

export const ON_DUTY_SHIFTS: OnDutyShift[] = [
  { id: 'sh-1', staffName: 'Dr. Meera Iyer', role: 'Emergency Physician', department: 'Emergency', shift: 'Morning', coverage: 'Trauma · Triage' },
  { id: 'sh-2', staffName: 'Nurse Priya Nair', role: 'Charge Nurse', department: 'ICU', shift: 'Morning', coverage: 'ICU 1-4' },
  { id: 'sh-3', staffName: 'Dr. Vikram Patil', role: 'Cardiologist', department: 'Cardiology', shift: 'Morning', coverage: 'Cath Lab · Ward rounds' },
  { id: 'sh-4', staffName: 'Raj Malhotra', role: 'OT Technician', department: 'OT', shift: 'Morning', coverage: 'Theatre 1-3' },
  { id: 'sh-5', staffName: 'Anjali Shah', role: 'Pharmacist', department: 'Pharmacy', shift: 'Morning', coverage: 'IPD dispensing · IV admixture' },
];

export const EQUIPMENT_MAINTENANCE: EquipmentMaintenance[] = [
  { id: 'eq-1', equipment: 'GE Optima CT660 — CT Scanner', location: 'Radiology Block B', status: 'Operational', nextService: '2026-08-12' },
  { id: 'eq-2', equipment: 'Dräger Evita V300 — Ventilator', location: 'ICU-3', status: 'Scheduled Maintenance', nextService: '2026-07-20' },
  { id: 'eq-3', equipment: 'Philips IntelliVue MX800 — Monitor', location: 'Emergency Bay 1', status: 'Operational', nextService: '2026-09-01' },
  { id: 'eq-4', equipment: 'Steris V-PRO — Low Temp Sterilizer', location: 'CSSD', status: 'Out of Service', nextService: '2026-07-19' },
];

export const INITIAL_APPROVALS: ApprovalRequest[] = [
  { id: 'ap-1', type: 'Purchase Approval', requester: 'OT Stores', summary: 'Surgical suture kit replenishment — Ethicon Vicryl assortment', amount: 84200, status: 'Pending', submittedAt: '2026-07-18T07:00:00', department: 'Procurement' },
  { id: 'ap-2', type: 'Leave Request', requester: 'Nurse Kavita Joshi', summary: 'Annual leave — 5 days, Ward C coverage arranged', status: 'Under Review', submittedAt: '2026-07-17T16:30:00', department: 'Nursing' },
  { id: 'ap-3', type: 'Discount Adjustment', requester: 'Billing Desk', summary: 'Senior citizen concession — IPD consolidated bill', amount: 12500, status: 'Pending', submittedAt: '2026-07-18T06:45:00', department: 'Billing' },
  { id: 'ap-4', type: 'Insurance Pre-Auth', requester: 'Admissions', summary: 'Star Health package — CABG post-operative IPD extension', amount: 285000, status: 'Under Review', submittedAt: '2026-07-17T14:00:00', department: 'Insurance' },
];

export const SHIFT_COMPLIANCE: ShiftComplianceRecord[] = [
  { id: 'sc-1', staffName: 'Nurse Priya Nair', department: 'ICU', scheduledHours: 8, actualHours: 9.5, compliance: 'Overtime', date: '2026-07-17' },
  { id: 'sc-2', staffName: 'Dr. Arjun Rao', department: 'Orthopedics', scheduledHours: 8, actualHours: 8, compliance: 'Compliant', date: '2026-07-17' },
  { id: 'sc-3', staffName: 'Housekeeping Team C', department: 'Facilities', scheduledHours: 8, actualHours: 6, compliance: 'Understaffed', date: '2026-07-17' },
];

export const INITIAL_AI_INSIGHTS: AiHospitalInsight[] = [
  { id: 'ai-1', category: 'Capacity', message: 'ICU occupancy may exceed 95% capacity tomorrow — 3 pending admissions flagged for step-down review', severity: 'Warning', status: 'Active', generatedAt: '2026-07-18T08:00:00' },
  { id: 'ai-2', category: 'Inventory', message: 'Piperacillin-Tazobactam, Enoxaparin, and Normal Saline 500mL below reorder thresholds — auto PR queued', severity: 'Critical', status: 'Active', generatedAt: '2026-07-18T07:45:00' },
  { id: 'ai-3', category: 'Operational', message: 'OPD no-show rate elevated 18% vs baseline — consider SMS reminder cadence adjustment', severity: 'Info', status: 'Active', generatedAt: '2026-07-18T07:30:00' },
];

export const AUDIT_LOGS: AuditLogEntry[] = [
  { id: 'au-1', timestamp: '2026-07-18T08:08:00', user: 'Dr. Meera Iyer', action: 'Viewed EMR — trauma patient', module: 'EMR', ipMasked: '[Network Address Masked]', result: 'Success' },
  { id: 'au-2', timestamp: '2026-07-18T07:52:00', user: 'Finance Desk', action: 'Approved discount — policy SC-2026', module: 'Billing', ipMasked: '[Network Address Masked]', result: 'Success' },
  { id: 'au-3', timestamp: '2026-07-18T07:35:00', user: 'Unknown Proxy', action: 'Bulk export attempt — patient demographics', module: 'Reports', ipMasked: '[Network Address Masked]', result: 'Denied' },
  { id: 'au-4', timestamp: '2026-07-18T07:20:00', user: 'Procurement Bot', action: 'Auto-generated PR-2026-11842', module: 'Procurement', ipMasked: '[Network Address Masked]', result: 'Success' },
];

export const PERFORMANCE_KPIS: PerformanceKpi[] = [
  { label: 'Bed Turnover Time', value: 4.2, unit: 'hrs', trend: 'down', target: 5 },
  { label: 'Average LOS', value: 3.8, unit: 'days', trend: 'stable', target: 4 },
  { label: 'OPD Wait Time', value: 28, unit: 'min', trend: 'up', target: 25 },
  { label: 'Claim Denial Rate', value: 4.1, unit: '%', trend: 'down', target: 5 },
];

export const AI_SAMPLE_RESPONSES: { query: string; response: string }[] = [
  { query: 'Which medicines are running low?', response: 'Critical stock alerts: Piperacillin-Tazobactam 4.5g (12 vials, reorder 50), Enoxaparin 40mg (8 syringes, reorder 100), Normal Saline 500mL (45 units, reorder 200). Auto PR-2026-11842 queued for procurement review.' },
  { query: 'ICU capacity forecast for tomorrow?', response: 'Current ICU census 28/32 (87.5%). Projected admissions: 3 (cardiac surgery ×2, sepsis ×1). Discharges planned: 1. Forecast occupancy 94% — recommend activating surge protocol and step-down bed allocation in Ward B.' },
];

export const OCCUPANCY_TREND = [
  { day: 'Mon', opd: 72, ipd: 298, icu: 24, er: 9 },
  { day: 'Tue', opd: 78, ipd: 305, icu: 26, er: 11 },
  { day: 'Wed', opd: 81, ipd: 308, icu: 27, er: 10 },
  { day: 'Thu', opd: 84, ipd: 310, icu: 28, er: 12 },
  { day: 'Fri', opd: 86, ipd: 312, icu: 28, er: 12 },
];

export const UNIVERSAL_SEARCH_INDEX: UniversalSearchResult[] = [
  { type: 'Patient', id: 'NX-2026-004821', label: 'Rajesh Kulkarni', subtitle: 'Emergency · Trauma Bay 2' },
  { type: 'Patient', id: 'NX-2026-004798', label: 'Anita Deshmukh', subtitle: 'IPD Ward B · Bed 14' },
  { type: 'Doctor', id: 'DOC-0042', label: 'Dr. Meera Iyer', subtitle: 'Emergency Medicine · On duty' },
  { type: 'Doctor', id: 'DOC-0018', label: 'Dr. Vikram Patil', subtitle: 'Cardiology · Cath Lab' },
  { type: 'Staff', id: 'STF-0881', label: 'Nurse Priya Nair', subtitle: 'ICU Charge Nurse · Morning shift' },
  { type: 'Invoice', id: 'INV-2026-44201', label: 'INV-2026-44201', subtitle: 'Rahul Sharma · OPD · Pending ₹18,400' },
  { type: 'Lab', id: 'LAB-2026-88102', label: 'LAB-2026-88102', subtitle: 'BMP + Coagulation · Critical K+ flagged' },
  { type: 'Purchase Order', id: 'PO-2026-11842', label: 'PO-2026-11842', subtitle: 'Surgical consumables · Expedited dispatch' },
];

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
}

export { formatINR as formatInr } from '@/lib/utils/currency';

export function searchUniversal(query: string): UniversalSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return UNIVERSAL_SEARCH_INDEX.filter(
    (r) =>
      r.label.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.subtitle.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q),
  );
}

export function getRoleFilteredTasks(tasks: WorkQueueItem[], role: HpRolePersona): WorkQueueItem[] {
  if (role === 'Admin') return tasks;
  return tasks.filter((t) => t.assignedRole === role || t.priority === 'Emergency');
}
