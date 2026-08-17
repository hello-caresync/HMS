import type {
  AnesthesiaClearance,
  ChecklistStatus,
  EquipmentStatus,
  OtRoomStatus,
  PostOpStepStatus,
  TimelineStep,
} from '../otNav.types';
import { advanceTimelineStep } from '../otNav.types';

export type SurgeryCase = {
  id: string;
  caseNumber: string;
  patientName: string;
  uhid: string;
  procedure: string;
  scheduledSurgeon: string;
  otRoom: string;
  scheduledTime: string;
  anesthesiaClearance: AnesthesiaClearance;
  timelineStep: TimelineStep;
  emergencyOt: boolean;
  consentVerified: boolean;
};

export type OtRoom = {
  id: string;
  roomLabel: string;
  floor: string;
  status: OtRoomStatus;
  currentCase?: string;
  patientName?: string;
  teamLead?: string;
};

export type SurgicalTeam = {
  id: string;
  otRoom: string;
  surgeon: string;
  assistant: string;
  anesthesiologist: string;
  otNurse: string;
  technician: string;
};

export type PreOpChecklist = {
  id: string;
  patientName: string;
  uhid: string;
  patientId: ChecklistStatus;
  fasting: ChecklistStatus;
  allergy: ChecklistStatus;
  bloodBank: ChecklistStatus;
  implant: ChecklistStatus;
  consentVerified: boolean;
};

export type EquipmentItem = {
  id: string;
  name: string;
  otRoom: string;
  status: EquipmentStatus;
  lastSterilized: string;
  assignedCase?: string;
};

export type PostOpFlow = {
  id: string;
  patientName: string;
  uhid: string;
  procedure: string;
  recoveryRoom: string;
  icuTransfer: PostOpStepStatus;
  wardHandover: PostOpStepStatus;
  notes: string;
};

export type OtBillingLine = {
  id: string;
  patientName: string;
  uhid: string;
  surgeryCharges: number;
  anesthesiaFees: number;
  implantLedger: number;
  total: number;
  paymentStatus: 'Paid' | 'Partial' | 'Outstanding';
};

export const OT_CENSUS = {
  todaySurgeries: 18,
  ongoing: 4,
  upcoming: 6,
  completed: 7,
  delayed: 2,
  cancelled: 1,
  availableRooms: 3,
  utilizationPercent: 72,
};

export const INITIAL_SURGERIES: SurgeryCase[] = [
  {
    id: 'sx1',
    caseNumber: 'OT-2026-0412',
    patientName: 'Arjun Das',
    uhid: 'NX-2026-000377',
    procedure: 'Total Knee Replacement — Left',
    scheduledSurgeon: 'Dr. Kapoor',
    otRoom: 'OT-3 Orthopedics',
    scheduledTime: '2026-07-18T08:00:00',
    anesthesiaClearance: 'Cleared',
    timelineStep: 'In Progress',
    emergencyOt: false,
    consentVerified: true,
  },
  {
    id: 'sx2',
    caseNumber: 'OT-2026-0415',
    patientName: 'Vikram Patel',
    uhid: 'NX-2026-000388',
    procedure: 'Craniotomy — Evacuation Hematoma',
    scheduledSurgeon: 'Dr. Meera Iyer',
    otRoom: 'OT-1 Neuro',
    scheduledTime: '2026-07-18T09:30:00',
    anesthesiaClearance: 'Cleared',
    timelineStep: 'Anesthesia Started',
    emergencyOt: true,
    consentVerified: true,
  },
  {
    id: 'sx3',
    caseNumber: 'OT-2026-0418',
    patientName: 'Somnath Reddy',
    uhid: 'NX-2026-000419',
    procedure: 'Laparoscopic Cholecystectomy',
    scheduledSurgeon: 'Dr. Anita Roy',
    otRoom: 'OT-5 General Surgery',
    scheduledTime: '2026-07-18T11:00:00',
    anesthesiaClearance: 'In Review',
    timelineStep: 'Preparation',
    emergencyOt: false,
    consentVerified: true,
  },
  {
    id: 'sx4',
    caseNumber: 'OT-2026-0410',
    patientName: 'Rahul Sharma',
    uhid: 'NX-2026-000412',
    procedure: 'CABG × 3 Grafts',
    scheduledSurgeon: 'Dr. Rajesh Kumar',
    otRoom: 'OT-2 Cardiac',
    scheduledTime: '2026-07-18T07:00:00',
    anesthesiaClearance: 'Cleared',
    timelineStep: 'Recovery Transfer',
    emergencyOt: false,
    consentVerified: true,
  },
  {
    id: 'sx5',
    caseNumber: 'OT-2026-0420',
    patientName: 'Deepa Singh',
    uhid: 'NX-2026-000352',
    procedure: 'Microdiscectomy L4-L5',
    scheduledSurgeon: 'Dr. Kapoor',
    otRoom: 'OT-3 Orthopedics',
    scheduledTime: '2026-07-18T13:00:00',
    anesthesiaClearance: 'Pending',
    timelineStep: 'Delayed',
    emergencyOt: false,
    consentVerified: true,
  },
  {
    id: 'sx6',
    caseNumber: 'OT-2026-0408',
    patientName: 'Meera Krishnan',
    uhid: 'NX-2026-000415',
    procedure: 'Appendectomy — Lap',
    scheduledSurgeon: 'Dr. Anita Roy',
    otRoom: 'OT-5 General Surgery',
    scheduledTime: '2026-07-18T06:30:00',
    anesthesiaClearance: 'Cleared',
    timelineStep: 'Completed',
    emergencyOt: false,
    consentVerified: true,
  },
];

export const MOCK_OT_ROOMS: OtRoom[] = [
  { id: 'r1', roomLabel: 'OT-1 Neuro', floor: 'Floor 4', status: 'Occupied', currentCase: 'OT-2026-0415', patientName: 'Vikram Patel', teamLead: 'Dr. Meera Iyer' },
  { id: 'r2', roomLabel: 'OT-2 Cardiac', floor: 'Floor 4', status: 'Cleaning', currentCase: 'OT-2026-0410' },
  { id: 'r3', roomLabel: 'OT-3 Orthopedics', floor: 'Floor 5', status: 'Occupied', currentCase: 'OT-2026-0412', patientName: 'Arjun Das', teamLead: 'Dr. Kapoor' },
  { id: 'r4', roomLabel: 'OT-4 ENT', floor: 'Floor 5', status: 'Available' },
  { id: 'r5', roomLabel: 'OT-5 General Surgery', floor: 'Floor 5', status: 'Sterilization' },
  { id: 'r6', roomLabel: 'OT-6 Emergency', floor: 'Floor 4', status: 'Maintenance' },
];

export const MOCK_SURGICAL_TEAMS: SurgicalTeam[] = [
  { id: 'st1', otRoom: 'OT-3 Orthopedics', surgeon: 'Dr. Kapoor', assistant: 'Dr. Sanjay N.', anesthesiologist: 'Dr. Priya Verma', otNurse: 'Sister Lakshmi N.', technician: 'Tech Ramesh P.' },
  { id: 'st2', otRoom: 'OT-1 Neuro', surgeon: 'Dr. Meera Iyer', assistant: 'Dr. Arun K.', anesthesiologist: 'Dr. Joseph M.', otNurse: 'Sister Susan Joseph', technician: 'Tech Anita R.' },
  { id: 'st3', otRoom: 'OT-2 Cardiac', surgeon: 'Dr. Rajesh Kumar', assistant: 'Dr. B. Joseph', anesthesiologist: 'Dr. Priya Verma', otNurse: 'Sister Meera Iyer', technician: 'Tech Mohan S.' },
];

export const MOCK_PREOP_CHECKLISTS: PreOpChecklist[] = [
  { id: 'pc1', patientName: 'Somnath Reddy', uhid: 'NX-2026-000419', patientId: 'Verified', fasting: 'Verified', allergy: 'Verified', bloodBank: 'Pending', implant: 'Not Applicable', consentVerified: true },
  { id: 'pc2', patientName: 'Deepa Singh', uhid: 'NX-2026-000352', patientId: 'Verified', fasting: 'Pending', allergy: 'Verified', bloodBank: 'Not Applicable', implant: 'Verified', consentVerified: true },
  { id: 'pc3', patientName: 'Vikram Patel', uhid: 'NX-2026-000388', patientId: 'Verified', fasting: 'Verified', allergy: 'Verified', bloodBank: 'Verified', implant: 'Not Applicable', consentVerified: true },
];

export const MOCK_EQUIPMENT: EquipmentItem[] = [
  { id: 'eq1', name: 'C-Arm Fluoroscopy', otRoom: 'OT-3 Orthopedics', status: 'In Use', lastSterilized: '2026-07-17', assignedCase: 'OT-2026-0412' },
  { id: 'eq2', name: 'Neuro Navigation System', otRoom: 'OT-1 Neuro', status: 'In Use', lastSterilized: '2026-07-18', assignedCase: 'OT-2026-0415' },
  { id: 'eq3', name: 'Laparoscopic Tower Set A', otRoom: 'OT-5 General Surgery', status: 'Sterilizing', lastSterilized: '2026-07-18' },
  { id: 'eq4', name: 'Cardiac Bypass Console', otRoom: 'OT-2 Cardiac', status: 'Ready', lastSterilized: '2026-07-18' },
  { id: 'eq5', name: 'Electrosurgical Unit — Bovie', otRoom: 'OT-4 ENT', status: 'Ready', lastSterilized: '2026-07-17' },
];

export const MOCK_POSTOP_FLOWS: PostOpFlow[] = [
  { id: 'po1', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', procedure: 'CABG × 3', recoveryRoom: 'PACU Bay 2', icuTransfer: 'Completed', wardHandover: 'In Progress', notes: 'Hemodynamically stable — ICU step-down planned' },
  { id: 'po2', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', procedure: 'Appendectomy', recoveryRoom: 'PACU Bay 4', icuTransfer: 'Pending', wardHandover: 'Completed', notes: 'Discharged to Ward 6B — post-op day 0' },
  { id: 'po3', patientName: 'Arjun Das', uhid: 'NX-2026-000377', procedure: 'TKR Left', recoveryRoom: 'PACU Bay 1', icuTransfer: 'Pending', wardHandover: 'Pending', notes: 'Surgery in progress — PACU reserved' },
];

export const MOCK_BILLING: OtBillingLine[] = [
  { id: 'OB-901', patientName: 'Meera Krishnan', uhid: 'NX-2026-000415', surgeryCharges: 85000, anesthesiaFees: 18000, implantLedger: 0, total: 103000, paymentStatus: 'Paid' },
  { id: 'OB-902', patientName: 'Rahul Sharma', uhid: 'NX-2026-000412', surgeryCharges: 420000, anesthesiaFees: 65000, implantLedger: 185000, total: 670000, paymentStatus: 'Partial' },
  { id: 'OB-903', patientName: 'Arjun Das', uhid: 'NX-2026-000377', surgeryCharges: 280000, anesthesiaFees: 42000, implantLedger: 95000, total: 417000, paymentStatus: 'Outstanding' },
];

export const DELAY_ANALYSIS = [
  { reason: 'Anesthesia Delay', count: 4, avgMin: 22 },
  { reason: 'Equipment Setup', count: 3, avgMin: 18 },
  { reason: 'Prior Case Overrun', count: 5, avgMin: 35 },
  { reason: 'Patient Prep', count: 2, avgMin: 15 },
];

export const CANCELLATION_REPORT = [
  { month: 'Jan', scheduled: 142, cancelled: 6 },
  { month: 'Feb', scheduled: 138, cancelled: 4 },
  { month: 'Mar', scheduled: 155, cancelled: 8 },
  { month: 'Apr', scheduled: 148, cancelled: 5 },
  { month: 'May', scheduled: 162, cancelled: 7 },
  { month: 'Jun', scheduled: 158, cancelled: 5 },
];

export const SURGEON_UTILIZATION = [
  { surgeon: 'Dr. Kapoor', cases: 42, utilization: 78, avgDurationMin: 145 },
  { surgeon: 'Dr. Anita Roy', cases: 38, utilization: 72, avgDurationMin: 98 },
  { surgeon: 'Dr. Rajesh Kumar', cases: 24, utilization: 85, avgDurationMin: 210 },
  { surgeon: 'Dr. Meera Iyer', cases: 18, utilization: 68, avgDurationMin: 185 },
];

export function searchSurgeries(query: string, cases: SurgeryCase[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  return cases.filter(
    (s) =>
      s.patientName.toLowerCase().includes(q) ||
      s.uhid.toLowerCase().includes(q) ||
      s.caseNumber.toLowerCase().includes(q) ||
      s.procedure.toLowerCase().includes(q) ||
      s.scheduledSurgeon.toLowerCase().includes(q),
  ).length;
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export { formatINR as formatInr } from '@/lib/utils/currency';

export { advanceTimelineStep };
