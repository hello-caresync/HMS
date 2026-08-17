import type {
  BedStatus,
  DischargeStepStatus,
  RequestPriority,
  RequestStatus,
  WardCategory,
} from '../admissionsNav.types';

export type AdmissionRequest = {
  id: string;
  patientName: string;
  uhid: string;
  source: 'Doctor Request' | 'Emergency' | 'Elective' | 'Referral';
  priority: RequestPriority;
  department: string;
  requestingDoctor: string;
  requestedAt: string;
  status: RequestStatus;
  identityVerified: boolean;
};

export type InpatientMonitor = {
  id: string;
  patientName: string;
  uhid: string;
  ward: string;
  bed: string;
  nurseAssigned: string;
  admissionDate: string;
  expectedDischarge: string;
  status: 'Active IPD' | 'ICU' | 'Emergency Hold';
};

export type BedCell = {
  id: string;
  label: string;
  ward: WardCategory;
  floor: string;
  status: BedStatus;
  patientName?: string;
  uhid?: string;
};

export type TransferRecord = {
  id: string;
  patientName: string;
  uhid: string;
  fromLocation: string;
  toLocation: string;
  reason: string;
  status: 'Pending Approval' | 'Approved' | 'Completed';
  requestedAt: string;
};

export type RoomHistoryEntry = {
  id: string;
  timestamp: string;
  patientName: string;
  change: string;
};

export type FinanceRecord = {
  id: string;
  patientName: string;
  uhid: string;
  packageName: string;
  depositAmount: number;
  advancePaid: number;
  insuranceStatus: 'Pre-Auth Approved' | 'Pending' | 'Self Pay' | 'Denied';
  tpaName: string;
};

export type DischargePipeline = {
  id: string;
  patientName: string;
  uhid: string;
  ward: string;
  steps: { name: string; status: DischargeStepStatus; owner: string }[];
  gatepassIssued: boolean;
};

export const ADMISSION_CENSUS = {
  todayAdmissions: 24,
  currentInpatients: 389,
  pendingAdmissions: 11,
  scheduled: 18,
  emergencyEntries: 6,
  bedOccupancyPercent: 84,
  todayDischarges: 19,
  avgLengthOfStay: 4.2,
};

export const MOCK_ADMISSION_REQUESTS: AdmissionRequest[] = [
  {
    id: 'AR-8841',
    patientName: 'Rahul Sharma',
    uhid: 'NX-2026-000412',
    source: 'Doctor Request',
    priority: 'Urgent',
    department: 'Cardiology',
    requestingDoctor: 'Dr. Anita Roy',
    requestedAt: '2026-07-18T08:22:00',
    status: 'Pending',
    identityVerified: true,
  },
  {
    id: 'AR-8842',
    patientName: 'Meera Krishnan',
    uhid: 'NX-2026-000415',
    source: 'Emergency',
    priority: 'Emergency',
    department: 'Emergency Medicine',
    requestingDoctor: 'Dr. B. Joseph',
    requestedAt: '2026-07-18T05:38:00',
    status: 'In Progress',
    identityVerified: true,
  },
  {
    id: 'AR-8843',
    patientName: 'Somnath Reddy',
    uhid: 'NX-2026-000419',
    source: 'Elective',
    priority: 'Elective',
    department: 'Orthopedics',
    requestingDoctor: 'Dr. Kapoor',
    requestedAt: '2026-07-17T14:10:00',
    status: 'Approved',
    identityVerified: true,
  },
  {
    id: 'AR-8844',
    patientName: 'Priya Patel',
    uhid: 'NX-2026-000413',
    source: 'Referral',
    priority: 'Referral',
    department: 'Pulmonology',
    requestingDoctor: 'Dr. Meera Iyer',
    requestedAt: '2026-07-18T09:05:00',
    status: 'Pending',
    identityVerified: false,
  },
  {
    id: 'AR-8839',
    patientName: 'Vikram Patel',
    uhid: 'NX-2026-000388',
    source: 'Doctor Request',
    priority: 'Urgent',
    department: 'General Medicine',
    requestingDoctor: 'Dr. Rajesh Kumar',
    requestedAt: '2026-07-18T07:30:00',
    status: 'Pending',
    identityVerified: true,
  },
];

export const MOCK_INPATIENTS: InpatientMonitor[] = [
  {
    id: 'ip1',
    patientName: 'Rahul Sharma',
    uhid: 'NX-2026-000412',
    ward: 'Ward 3A — Cardiology',
    bed: 'Bed 12',
    nurseAssigned: 'Sister Meera Iyer',
    admissionDate: '2026-07-14',
    expectedDischarge: '2026-07-19',
    status: 'Active IPD',
  },
  {
    id: 'ip2',
    patientName: 'Meera Krishnan',
    uhid: 'NX-2026-000415',
    ward: 'ICU-4',
    bed: 'Bed 02',
    nurseAssigned: 'Sister Susan Joseph',
    admissionDate: '2026-07-18',
    expectedDischarge: 'Under review',
    status: 'ICU',
  },
  {
    id: 'ip3',
    patientName: 'Arjun Das',
    uhid: 'NX-2026-000377',
    ward: 'Ward 6B — Orthopedics',
    bed: 'Bed 08',
    nurseAssigned: 'Sister Lakshmi N.',
    admissionDate: '2026-07-12',
    expectedDischarge: '2026-07-20',
    status: 'Active IPD',
  },
  {
    id: 'ip4',
    patientName: 'Sanjay Rao',
    uhid: 'NX-2026-000365',
    ward: 'ER Hold Bay',
    bed: 'T-4',
    nurseAssigned: 'ER Team Alpha',
    admissionDate: '2026-07-18',
    expectedDischarge: 'Pending stabilization',
    status: 'Emergency Hold',
  },
];

export const MOCK_BED_GRID: BedCell[] = [
  { id: 'b1', label: '3A-12', ward: 'General Ward', floor: 'Floor 3', status: 'Occupied', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412' },
  { id: 'b2', label: '3A-13', ward: 'General Ward', floor: 'Floor 3', status: 'Available' },
  { id: 'b3', label: '3A-14', ward: 'General Ward', floor: 'Floor 3', status: 'Cleaning' },
  { id: 'b4', label: 'SP-201', ward: 'Semi-Private', floor: 'Floor 2', status: 'Reserved' },
  { id: 'b5', label: 'SP-202', ward: 'Semi-Private', floor: 'Floor 2', status: 'Occupied', patientName: 'Deepa Singh', uhid: 'NX-2026-000352' },
  { id: 'b6', label: 'PR-501', ward: 'Private Room', floor: 'Floor 5', status: 'Available' },
  { id: 'b7', label: 'PR-502', ward: 'Private Room', floor: 'Floor 5', status: 'Occupied', patientName: 'Rajesh Kumar', uhid: 'NX-2026-000301' },
  { id: 'b8', label: 'ICU-01', ward: 'ICU', floor: 'Floor 4', status: 'Occupied', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415' },
  { id: 'b9', label: 'ICU-02', ward: 'ICU', floor: 'Floor 4', status: 'Available' },
  { id: 'b10', label: 'ICU-03', ward: 'ICU', floor: 'Floor 4', status: 'Reserved' },
  { id: 'b11', label: '6B-08', ward: 'General Ward', floor: 'Floor 6', status: 'Occupied', patientName: 'Arjun Das', uhid: 'NX-2026-000377' },
  { id: 'b12', label: '6B-09', ward: 'General Ward', floor: 'Floor 6', status: 'Available' },
];

export const MOCK_TRANSFERS: TransferRecord[] = [
  {
    id: 'TR-441',
    patientName: 'Meera Krishnan',
    uhid: 'NX-2026-000415',
    fromLocation: 'ER Bay T-4',
    toLocation: 'ICU-4 Bed 02',
    reason: 'Hypertensive crisis — step-up care',
    status: 'Completed',
    requestedAt: '2026-07-18T06:15:00',
  },
  {
    id: 'TR-438',
    patientName: 'Rahul Sharma',
    uhid: 'NX-2026-000412',
    fromLocation: 'Ward 3A Bed 10',
    toLocation: 'Ward 3A Bed 12',
    reason: 'Telemetry bed requirement',
    status: 'Approved',
    requestedAt: '2026-07-14T13:00:00',
  },
  {
    id: 'TR-435',
    patientName: 'Vikram Patel',
    uhid: 'NX-2026-000388',
    fromLocation: 'General Medicine Ward',
    toLocation: 'Semi-Private SP-201',
    reason: 'Package upgrade — patient request',
    status: 'Pending Approval',
    requestedAt: '2026-07-18T10:00:00',
  },
];

export const MOCK_ROOM_HISTORY: RoomHistoryEntry[] = [
  { id: 'rh1', timestamp: '2026-07-18 06:22', patientName: 'Meera Krishnan', change: 'ER T-4 → ICU-4 Bed 02 (Emergency transfer)' },
  { id: 'rh2', timestamp: '2026-07-14 14:15', patientName: 'Rahul Sharma', change: 'Ward 3A Bed 10 → Bed 12 (Telemetry upgrade)' },
  { id: 'rh3', timestamp: '2026-07-12 09:00', patientName: 'Arjun Das', change: 'Admitted → Ward 6B Bed 08 (Post-TKR)' },
];

export const MOCK_FINANCE: FinanceRecord[] = [
  {
    id: 'FN-8841',
    patientName: 'Rahul Sharma',
    uhid: 'NX-2026-000412',
    packageName: 'Cardiac IPD Package — 5 days',
    depositAmount: 50000,
    advancePaid: 75000,
    insuranceStatus: 'Pre-Auth Approved',
    tpaName: 'Star Health',
  },
  {
    id: 'FN-8842',
    patientName: 'Meera Krishnan',
    uhid: 'NX-2026-000415',
    packageName: 'ICU Critical Care — Daily',
    depositAmount: 100000,
    advancePaid: 100000,
    insuranceStatus: 'Pending',
    tpaName: 'Self Pay',
  },
  {
    id: 'FN-8839',
    patientName: 'Somnath Reddy',
    uhid: 'NX-2026-000419',
    packageName: 'Orthopedic Surgery Package',
    depositAmount: 80000,
    advancePaid: 120000,
    insuranceStatus: 'Pre-Auth Approved',
    tpaName: 'HDFC ERGO',
  },
];

export const MOCK_DISCHARGE_PIPELINES: DischargePipeline[] = [
  {
    id: 'DP-1',
    patientName: 'Somnath Reddy',
    uhid: 'NX-2026-000419',
    ward: 'Orthopedics 6B',
    gatepassIssued: false,
    steps: [
      { name: 'Medical Clearance', status: 'Complete', owner: 'Dr. Kapoor' },
      { name: 'Nursing Sign-off', status: 'Complete', owner: 'Sister Lakshmi N.' },
      { name: 'Pharmacy Audit', status: 'Pending', owner: 'Pharmacy Desk' },
      { name: 'Billing Clearance', status: 'Pending', owner: 'Billing Counter' },
      { name: 'Digital Gatepass', status: 'Pending', owner: 'Front Office' },
    ],
  },
  {
    id: 'DP-2',
    patientName: 'Arjun Das',
    uhid: 'NX-2026-000377',
    ward: 'Orthopedics 6B',
    gatepassIssued: false,
    steps: [
      { name: 'Medical Clearance', status: 'Pending', owner: 'Dr. Kapoor' },
      { name: 'Nursing Sign-off', status: 'Pending', owner: 'Sister Lakshmi N.' },
      { name: 'Pharmacy Audit', status: 'Pending', owner: 'Pharmacy Desk' },
      { name: 'Billing Clearance', status: 'Blocked', owner: 'Billing — outstanding ₹8,400' },
      { name: 'Digital Gatepass', status: 'Pending', owner: 'Front Office' },
    ],
  },
];

export const ADMISSION_TREND = [
  { label: 'Mon', admissions: 18, discharges: 14, readmissions: 2 },
  { label: 'Tue', admissions: 22, discharges: 16, readmissions: 1 },
  { label: 'Wed', admissions: 19, discharges: 18, readmissions: 3 },
  { label: 'Thu', admissions: 24, discharges: 19, readmissions: 2 },
  { label: 'Fri', admissions: 21, discharges: 17, readmissions: 1 },
  { label: 'Sat', admissions: 16, discharges: 12, readmissions: 0 },
  { label: 'Sun', admissions: 14, discharges: 11, readmissions: 1 },
];

export const WARD_UTILIZATION = [
  { ward: 'General', utilization: 86 },
  { ward: 'Semi-Private', utilization: 72 },
  { ward: 'Private', utilization: 58 },
  { ward: 'ICU', utilization: 91 },
];

export function searchAdmissions(query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const all = [...MOCK_ADMISSION_REQUESTS, ...MOCK_INPATIENTS];
  return all.filter(
    (r) =>
      r.patientName.toLowerCase().includes(q) ||
      r.uhid.toLowerCase().includes(q) ||
      ('id' in r && r.id.toLowerCase().includes(q)),
  ).length;
}

export { formatINR as formatInr } from '@/lib/utils/currency';

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
