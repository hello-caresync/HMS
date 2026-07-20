import type {
  BedAssetStatus,
  CareAlertType,
  ClearanceStepStatus,
  ClinicalStatus,
  MovementStatus,
  MovementType,
  PaymentValidation,
  RoomType,
  VitalCompliance,
} from '../ipdNav.types';

export type IpdInpatient = {
  id: string;
  patientName: string;
  uhid: string;
  ward: string;
  room: string;
  bed: string;
  clinicalStatus: ClinicalStatus;
  nursingStation: string;
  assignedNurse: string;
  consultant: string;
  admissionDate: string;
  expectedDischarge: string;
  vitalCompliance: VitalCompliance;
  identityVerified: boolean;
};

export type BedAsset = {
  id: string;
  label: string;
  ward: string;
  roomType: RoomType;
  floor: string;
  status: BedAssetStatus;
  patientName?: string;
  uhid?: string;
};

export type NurseAssignment = {
  id: string;
  nurseName: string;
  station: string;
  shift: string;
  patientsAssigned: number;
  ward: string;
};

export type ShiftHandover = {
  id: string;
  fromNurse: string;
  toNurse: string;
  ward: string;
  time: string;
  pendingTasks: number;
  status: 'Completed' | 'In Progress' | 'Pending';
};

export type MedAdminCheck = {
  id: string;
  patientName: string;
  medication: string;
  scheduledTime: string;
  status: 'Given' | 'Due' | 'Missed' | 'Held';
};

export type VitalRecord = {
  id: string;
  patientName: string;
  uhid: string;
  lastRecorded: string;
  bp: string;
  pulse: string;
  temp: string;
  spo2: string;
  compliance: VitalCompliance;
};

export type CareAlert = {
  id: string;
  patientName: string;
  type: CareAlertType;
  detail: string;
  severity: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Acknowledged' | 'Resolved';
};

export type DietOrder = {
  id: string;
  patientName: string;
  dietType: string;
  mealSlot: string;
  status: 'Served' | 'Pending' | 'NPO';
};

export type PatientMovement = {
  id: string;
  patientName: string;
  uhid: string;
  type: MovementType;
  fromLocation: string;
  toLocation: string;
  status: MovementStatus;
  scheduledAt: string;
};

export type BillingLedger = {
  id: string;
  patientName: string;
  uhid: string;
  ward: string;
  roomCharges: number;
  nursingCharges: number;
  procedureFees: number;
  insuranceValidation: PaymentValidation;
  runningTotal: number;
};

export type DischargeClearance = {
  id: string;
  patientName: string;
  uhid: string;
  ward: string;
  bed: string;
  steps: { name: string; status: ClearanceStepStatus; owner: string }[];
  bedReleaseReady: boolean;
};

export const IPD_CENSUS = {
  currentInpatients: 389,
  todayAdmissions: 24,
  todayDischarges: 19,
  icuPatients: 28,
  wardOccupancy: 342,
  bedOccupancyPercent: 84,
  avgLengthOfStay: 4.2,
  criticalPatients: 14,
  expectedDischarges: 22,
};

export const MOCK_INPATIENTS: IpdInpatient[] = [
  {
    id: 'ip1',
    patientName: 'Rahul Sharma',
    uhid: 'NX-2026-000412',
    ward: 'Cardiology 3A',
    room: 'Room 312',
    bed: 'Bed 12',
    clinicalStatus: 'Stable',
    nursingStation: 'NS-3A East',
    assignedNurse: 'Sister Meera Iyer',
    consultant: 'Dr. Anita Roy',
    admissionDate: '2026-07-14',
    expectedDischarge: '2026-07-19',
    vitalCompliance: 'Compliant',
    identityVerified: true,
  },
  {
    id: 'ip2',
    patientName: 'Meera Krishnan',
    uhid: 'NX-2026-000415',
    ward: 'ICU-4',
    room: 'ICU Bay 02',
    bed: 'Bed 02',
    clinicalStatus: 'ICU',
    nursingStation: 'NS-ICU Central',
    assignedNurse: 'Sister Susan Joseph',
    consultant: 'Dr. B. Joseph',
    admissionDate: '2026-07-18',
    expectedDischarge: 'Under review',
    vitalCompliance: 'Due Soon',
    identityVerified: true,
  },
  {
    id: 'ip3',
    patientName: 'Arjun Das',
    uhid: 'NX-2026-000377',
    ward: 'Orthopedics 6B',
    room: 'Room 608',
    bed: 'Bed 08',
    clinicalStatus: 'Under Review',
    nursingStation: 'NS-6B West',
    assignedNurse: 'Sister Lakshmi N.',
    consultant: 'Dr. Kapoor',
    admissionDate: '2026-07-12',
    expectedDischarge: '2026-07-20',
    vitalCompliance: 'Compliant',
    identityVerified: true,
  },
  {
    id: 'ip4',
    patientName: 'Sanjay Rao',
    uhid: 'NX-2026-000365',
    ward: 'General Medicine 2C',
    room: 'Room 214',
    bed: 'Bed 04',
    clinicalStatus: 'High Risk',
    nursingStation: 'NS-2C North',
    assignedNurse: 'Sister Priya Menon',
    consultant: 'Dr. Rajesh Kumar',
    admissionDate: '2026-07-16',
    expectedDischarge: '2026-07-21',
    vitalCompliance: 'Overdue',
    identityVerified: true,
  },
  {
    id: 'ip5',
    patientName: 'Deepa Singh',
    uhid: 'NX-2026-000352',
    ward: 'Neurology 5D',
    room: 'Private 502',
    bed: 'Bed 01',
    clinicalStatus: 'Critical',
    nursingStation: 'NS-5D Private',
    assignedNurse: 'Sister Anitha R.',
    consultant: 'Dr. Meera Iyer',
    admissionDate: '2026-07-10',
    expectedDischarge: 'TBD',
    vitalCompliance: 'Due Soon',
    identityVerified: true,
  },
  {
    id: 'ip6',
    patientName: 'Somnath Reddy',
    uhid: 'NX-2026-000419',
    ward: 'Orthopedics 6B',
    room: 'Room 610',
    bed: 'Bed 10',
    clinicalStatus: 'Stable',
    nursingStation: 'NS-6B West',
    assignedNurse: 'Sister Lakshmi N.',
    consultant: 'Dr. Kapoor',
    admissionDate: '2026-07-15',
    expectedDischarge: '2026-07-18',
    vitalCompliance: 'Compliant',
    identityVerified: true,
  },
];

export const MOCK_BED_ASSETS: BedAsset[] = [
  { id: 'b1', label: '3A-12', ward: 'Cardiology 3A', roomType: 'General', floor: 'Floor 3', status: 'Occupied', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412' },
  { id: 'b2', label: '3A-13', ward: 'Cardiology 3A', roomType: 'General', floor: 'Floor 3', status: 'Available' },
  { id: 'b3', label: '3A-14', ward: 'Cardiology 3A', roomType: 'General', floor: 'Floor 3', status: 'Cleaning' },
  { id: 'b4', label: 'SP-201', ward: 'Semi-Private 2B', roomType: 'Semi-Private', floor: 'Floor 2', status: 'Reserved' },
  { id: 'b5', label: 'PR-502', ward: 'Neurology 5D', roomType: 'Private', floor: 'Floor 5', status: 'Occupied', patientName: 'Deepa Singh', uhid: 'NX-2026-000352' },
  { id: 'b6', label: 'ISO-101', ward: 'Isolation 1A', roomType: 'Isolation', floor: 'Floor 1', status: 'Available' },
  { id: 'b7', label: 'ICU-02', ward: 'ICU-4', roomType: 'General', floor: 'Floor 4', status: 'Occupied', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415' },
  { id: 'b8', label: '6B-08', ward: 'Orthopedics 6B', roomType: 'General', floor: 'Floor 6', status: 'Occupied', patientName: 'Arjun Das', uhid: 'NX-2026-000377' },
  { id: 'b9', label: '6B-10', ward: 'Orthopedics 6B', roomType: 'General', floor: 'Floor 6', status: 'Occupied', patientName: 'Somnath Reddy', uhid: 'NX-2026-000419' },
  { id: 'b10', label: '2C-04', ward: 'General Medicine 2C', roomType: 'General', floor: 'Floor 2', status: 'Occupied', patientName: 'Sanjay Rao', uhid: 'NX-2026-000365' },
];

export const MOCK_NURSE_ASSIGNMENTS: NurseAssignment[] = [
  { id: 'na1', nurseName: 'Sister Meera Iyer', station: 'NS-3A East', shift: 'Day · 07:00–15:00', patientsAssigned: 8, ward: 'Cardiology 3A' },
  { id: 'na2', nurseName: 'Sister Susan Joseph', station: 'NS-ICU Central', shift: 'Day · 07:00–19:00', patientsAssigned: 4, ward: 'ICU-4' },
  { id: 'na3', nurseName: 'Sister Lakshmi N.', station: 'NS-6B West', shift: 'Day · 07:00–15:00', patientsAssigned: 10, ward: 'Orthopedics 6B' },
  { id: 'na4', nurseName: 'Sister Priya Menon', station: 'NS-2C North', shift: 'Evening · 15:00–23:00', patientsAssigned: 9, ward: 'General Medicine 2C' },
];

export const MOCK_SHIFT_HANDOVERS: ShiftHandover[] = [
  { id: 'sh1', fromNurse: 'Sister Anitha R.', toNurse: 'Sister Meera Iyer', ward: 'Cardiology 3A', time: '2026-07-18 07:00', pendingTasks: 2, status: 'Completed' },
  { id: 'sh2', fromNurse: 'Sister Lakshmi N.', toNurse: 'Sister Rajini K.', ward: 'Orthopedics 6B', time: '2026-07-18 15:00', pendingTasks: 5, status: 'In Progress' },
  { id: 'sh3', fromNurse: 'Sister Susan Joseph', toNurse: 'Sister Joseph M.', ward: 'ICU-4', time: '2026-07-18 19:00', pendingTasks: 3, status: 'Pending' },
];

export const MOCK_MED_CHECKS: MedAdminCheck[] = [
  { id: 'mc1', patientName: 'Rahul Sharma', medication: 'Aspirin 75mg', scheduledTime: '09:00', status: 'Given' },
  { id: 'mc2', patientName: 'Meera Krishnan', medication: 'Noradrenaline Infusion', scheduledTime: '09:30', status: 'Given' },
  { id: 'mc3', patientName: 'Arjun Das', medication: 'Enoxaparin 40mg SC', scheduledTime: '10:00', status: 'Due' },
  { id: 'mc4', patientName: 'Sanjay Rao', medication: 'Insulin Glargine 10U', scheduledTime: '08:00', status: 'Missed' },
];

export const MOCK_VITALS: VitalRecord[] = [
  { id: 'v1', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', lastRecorded: '2026-07-18 09:00', bp: '128/82', pulse: '76', temp: '98.4°F', spo2: '97%', compliance: 'Compliant' },
  { id: 'v2', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', lastRecorded: '2026-07-18 09:15', bp: '168/102', pulse: '92', temp: '99.1°F', spo2: '94%', compliance: 'Due Soon' },
  { id: 'v3', patientName: 'Sanjay Rao', uhid: 'NX-2026-000365', lastRecorded: '2026-07-18 06:30', bp: '142/88', pulse: '84', temp: '100.4°F', spo2: '96%', compliance: 'Overdue' },
];

export const MOCK_CARE_ALERTS: CareAlert[] = [
  { id: 'ca1', patientName: 'Sanjay Rao', type: 'Fall Risk', detail: 'Morse Fall Scale 65 — high risk, bed alarm active', severity: 'High', status: 'Active' },
  { id: 'ca2', patientName: 'Deepa Singh', type: 'Infection Control', detail: 'Contact isolation — MRSA screen positive', severity: 'High', status: 'Acknowledged' },
  { id: 'ca3', patientName: 'Arjun Das', type: 'Diet Order', detail: 'Diabetic soft diet — lunch pending kitchen dispatch', severity: 'Medium', status: 'Active' },
];

export const MOCK_DIET_ORDERS: DietOrder[] = [
  { id: 'do1', patientName: 'Rahul Sharma', dietType: 'Cardiac Low-Sodium', mealSlot: 'Lunch', status: 'Served' },
  { id: 'do2', patientName: 'Arjun Das', dietType: 'Diabetic Soft', mealSlot: 'Lunch', status: 'Pending' },
  { id: 'do3', patientName: 'Meera Krishnan', dietType: 'NPO — ICU', mealSlot: 'All Meals', status: 'NPO' },
];

export const INITIAL_MOVEMENTS: PatientMovement[] = [
  { id: 'mv1', patientName: 'Arjun Das', uhid: 'NX-2026-000377', type: 'Diagnostic Transfer', fromLocation: 'Ward 6B Bed 08', toLocation: 'Radiology — MRI Suite', status: 'Scheduled', scheduledAt: '2026-07-18T10:30:00' },
  { id: 'mv2', patientName: 'Somnath Reddy', uhid: 'NX-2026-000419', type: 'OT Transfer', fromLocation: 'Ward 6B Bed 10', toLocation: 'OT-3 — Orthopedic Theatre', status: 'In Transit', scheduledAt: '2026-07-18T09:45:00' },
  { id: 'mv3', patientName: 'Sanjay Rao', uhid: 'NX-2026-000365', type: 'ICU Transfer', fromLocation: 'Ward 2C Bed 04', toLocation: 'ICU-4 Bed 05', status: 'Pending Approval', scheduledAt: '2026-07-18T11:00:00' },
  { id: 'mv4', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', type: 'Ward Transfer', fromLocation: 'ER Hold T-4', toLocation: 'ICU-4 Bed 02', status: 'Completed', scheduledAt: '2026-07-18T06:15:00' },
];

export const MOCK_BILLING: BillingLedger[] = [
  { id: 'BL-IP-901', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', ward: 'Cardiology 3A', roomCharges: 18500, nursingCharges: 4200, procedureFees: 8500, insuranceValidation: 'Validated', runningTotal: 31200 },
  { id: 'BL-IP-902', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', ward: 'ICU-4', roomCharges: 42000, nursingCharges: 9800, procedureFees: 15600, insuranceValidation: 'Pending', runningTotal: 67400 },
  { id: 'BL-IP-903', patientName: 'Somnath Reddy', uhid: 'NX-2026-000419', ward: 'Orthopedics 6B', roomCharges: 22400, nursingCharges: 5100, procedureFees: 42000, insuranceValidation: 'Validated', runningTotal: 69500 },
  { id: 'BL-IP-904', patientName: 'Sanjay Rao', uhid: 'NX-2026-000365', ward: 'General Medicine 2C', roomCharges: 12800, nursingCharges: 3800, procedureFees: 2400, insuranceValidation: 'Denied', runningTotal: 19000 },
];

export const INITIAL_DISCHARGE_CLEARANCE: DischargeClearance[] = [
  {
    id: 'DC-1',
    patientName: 'Somnath Reddy',
    uhid: 'NX-2026-000419',
    ward: 'Orthopedics 6B',
    bed: 'Bed 10',
    bedReleaseReady: false,
    steps: [
      { name: 'Medical Clearance', status: 'Cleared', owner: 'Dr. Kapoor' },
      { name: 'Nursing Clearance', status: 'Cleared', owner: 'Sister Lakshmi N.' },
      { name: 'Pharmacy Clearance', status: 'Under Review', owner: 'Pharmacy Desk' },
      { name: 'Billing Clearance', status: 'Pending', owner: 'Billing Counter' },
      { name: 'Final Bill Status', status: 'Pending', owner: 'Finance' },
    ],
  },
  {
    id: 'DC-2',
    patientName: 'Arjun Das',
    uhid: 'NX-2026-000377',
    ward: 'Orthopedics 6B',
    bed: 'Bed 08',
    bedReleaseReady: false,
    steps: [
      { name: 'Medical Clearance', status: 'Under Review', owner: 'Dr. Kapoor' },
      { name: 'Nursing Clearance', status: 'Pending', owner: 'Sister Lakshmi N.' },
      { name: 'Pharmacy Clearance', status: 'Pending', owner: 'Pharmacy Desk' },
      { name: 'Billing Clearance', status: 'Blocked', owner: 'Outstanding ₹8,400' },
      { name: 'Final Bill Status', status: 'Pending', owner: 'Finance' },
    ],
  },
  {
    id: 'DC-3',
    patientName: 'Rahul Sharma',
    uhid: 'NX-2026-000412',
    ward: 'Cardiology 3A',
    bed: 'Bed 12',
    bedReleaseReady: true,
    steps: [
      { name: 'Medical Clearance', status: 'Cleared', owner: 'Dr. Anita Roy' },
      { name: 'Nursing Clearance', status: 'Cleared', owner: 'Sister Meera Iyer' },
      { name: 'Pharmacy Clearance', status: 'Cleared', owner: 'Pharmacy Desk' },
      { name: 'Billing Clearance', status: 'Cleared', owner: 'Billing Counter' },
      { name: 'Final Bill Status', status: 'Cleared', owner: 'Finance' },
    ],
  },
];

export const WARD_UTILIZATION_TREND = [
  { day: 'Mon', general: 82, icu: 88, private: 58 },
  { day: 'Tue', general: 84, icu: 91, private: 62 },
  { day: 'Wed', general: 86, icu: 89, private: 55 },
  { day: 'Thu', general: 83, icu: 93, private: 60 },
  { day: 'Fri', general: 85, icu: 90, private: 64 },
  { day: 'Sat', general: 78, icu: 85, private: 52 },
  { day: 'Sun', general: 76, icu: 87, private: 48 },
];

export const ICU_CAPACITY_CURVE = [
  { hour: '00:00', occupied: 22, capacity: 32 },
  { hour: '04:00', occupied: 24, capacity: 32 },
  { hour: '08:00', occupied: 26, capacity: 32 },
  { hour: '12:00', occupied: 28, capacity: 32 },
  { hour: '16:00', occupied: 27, capacity: 32 },
  { hour: '20:00', occupied: 28, capacity: 32 },
];

export const READMISSION_RATES = [
  { period: '7-Day', rate: 2.1 },
  { period: '15-Day', rate: 3.4 },
  { period: '30-Day', rate: 4.8 },
  { period: '90-Day', rate: 7.2 },
];

export const IPD_NURSES = ['Sister Meera Iyer', 'Sister Susan Joseph', 'Sister Lakshmi N.', 'Sister Priya Menon', 'Sister Anitha R.'];

export function searchInpatients(query: string, list: IpdInpatient[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  return list.filter(
    (p) =>
      p.patientName.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.ward.toLowerCase().includes(q) ||
      p.room.toLowerCase().includes(q) ||
      p.bed.toLowerCase().includes(q),
  ).length;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function advanceClearanceStatus(current: ClearanceStepStatus): ClearanceStepStatus {
  const flow: ClearanceStepStatus[] = ['Pending', 'Under Review', 'Cleared'];
  const idx = flow.indexOf(current);
  if (idx === -1 || current === 'Blocked' || idx === flow.length - 1) return current;
  return flow[idx + 1];
}

export function advanceMovementStatus(current: MovementStatus): MovementStatus {
  const flow: MovementStatus[] = ['Pending Approval', 'Scheduled', 'In Transit', 'Completed'];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx === flow.length - 1) return current;
  return flow[idx + 1];
}

export function isBedReleaseReady(steps: DischargeClearance['steps']): boolean {
  return steps.every((s) => s.status === 'Cleared');
}
